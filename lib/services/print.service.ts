import md5 from 'md5';
import { WarehouseOrder } from '../types/order';
import { generateQRData } from '../../utils/qr-generator';

// Kuaimai cloud print credentials
const KUAIMAI_APP_ID = '1763132720820';
const KUAIMAI_SECRET = '886dc8df0e384027a22c01001352dbc2';
const KUAIMAI_PRINTER_SN = 'KM118DW24200294';
const KUAIMAI_TEMPLATE_ID = '1634986912';
const KUAIMAI_PRINT_URL = 'https://cloud.kuaimai.com/api/cloud/print/tsplTemplatePrint';

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
};

const buildRenderDataArray = (order: any) => {
  const payload = [
    {
      "tester_order": [
        {
          order_number: order.client_article,
          // Trimmed QR payload (article, name, product, totals, cargo type,
          // client number) — short enough for a dense-free, scannable label QR
          qr_code: generateQRData(order),
          name: order.product_name,
          weight: `${order.weight}kg`,
          count: String(order.quantity),
          customer_phone: order.client_number,
          date: formatDate(order.created_at),
          volume: `${order.cubic_meters}m3`,
        },
      ],
    },
  ];

  // Important: API wants STRINGIFIED JSON with no extra spaces/newlines
  return JSON.stringify(payload);
};

const createDate = (date: any) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const signStr = ({ obj, secret }: any) => {
  // 1. Filter out undefined / null / empty values
  const filteredObj = Object.entries(obj)
    .filter(
      ([_, value]) =>
        value !== undefined &&
        value !== null &&
        value !== ""
    )
    .reduce<Record<string, any>>((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});

  // 2. Sort keys alphabetically
  const keysSorted = Object.keys(filteredObj).sort();

  // 3. Concatenate key + value
  const str = keysSorted
    .map((key) => `${key}${filteredObj[key]}`)
    .join("");

  // 4. md5(secret + str + secret)
  return md5(secret + str + secret);
};

export const printOrderLabel = (order: WarehouseOrder, copies: number = 1): void => {
  const renderData = buildRenderDataArray(order);

  const date = new Date();

  const data = {
    appId: KUAIMAI_APP_ID,
    printTimes: String(Math.max(1, Math.floor(copies))),
    sn: KUAIMAI_PRINTER_SN,
    renderDataArray: renderData,
    templateId: KUAIMAI_TEMPLATE_ID,
    timestamp: createDate(date),
  };

  const sign = signStr({ obj: data, secret: KUAIMAI_SECRET });
  const finalPayload = { ...data, sign };

  fetch(KUAIMAI_PRINT_URL, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(finalPayload) // body is stringified JSON
  })
    .then(res => res.json())
    .then(result => {
      console.log("Print result:", result);
    })
    .catch(err => {
      console.error("Print error:", err);
    });
};
