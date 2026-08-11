export type Language = 'ru' | 'zh';

export interface Translations {
  app: {
    title: string;
    subtitle: string;
  };
  form: {
    clientArticle: string;
    weight: string;
    dimensions: string;
    cubicMeters: string;
    productName: string;
    quantity: string;
    clientNumber: string;
    photos: string;
    submit: string;
    required: string;
    date: string;
  };
  placeholders: {
    clientArticle: string;
    weight: string;
    productName: string;
    quantity: string;
    clientNumber: string;
  };
  imagePicker: {
    takePhoto: string;
    fromGallery: string;
    photoCount: string;
    permissionsRequired: string;
    permissionsMessage: string;
    photoLimit: string;
    photoLimitMessage: string;
    errorTitle: string;
    cameraError: string;
    galleryError: string;
  };
  validation: {
    required: string;
    invalidWeight: string;
    invalidDimension: string;
    invalidQuantity: string;
    addPhoto: string;
    validationError: string;
    fillAllFields: string;
  };
  qr: {
    orderCreated: string;
    orderInfo: string;
    orderTitle: string;
    printLabel: string;
    newOrder: string;
    loading: string;
    errorTitle: string;
    errorMessage: string;
    printError: string;
    printErrorMessage: string;
  };
  upload: {
    uploadingPhotos: string;
    uploadingPhoto: string;
    creatingOrder: string;
    errorTitle: string;
    errorMessage: string;
  };
  language: {
    select: string;
    russian: string;
    chinese: string;
  };
  orders: {
    title: string;
    empty: string;
    emptyHint: string;
  };
  tabs: {
    insert: string;
    orders: string;
    language: string;
    dashboard: string;
  };
  dashboard: {
    title: string;
    loading: string;
    errorTitle: string;
    errorMessage: string;
    empty: string;
    refresh: string;
    exportExcel: string;
    deleteSelected: string;
    deleteConfirmTitle: string;
    deleteConfirmMessage: string;
    saveError: string;
    deleteError: string;
    webOnlyTitle: string;
    webOnlyMessage: string;
    openInBrowser: string;
  };
}

export const translations: Record<Language, Translations> = {
  ru: {
    app: {
      title: 'Обработка Заказа',
      subtitle: 'Склад',
    },
    form: {
      clientArticle: 'Артикул',
      weight: 'Вес (кг)',
      dimensions: 'Размеры (см)',
      cubicMeters: 'Объём (м³)',
      productName: 'Наименование',
      quantity: 'Кол-во в коробке',
      clientNumber: 'Номер клиента',
      photos: 'Фотографии товара',
      submit: 'Создать QR-код',
      required: '*',
      date: 'Дата',
    },
    placeholders: {
      clientArticle: 'Введите артикул клиента',
      weight: '0.00',
      productName: 'Введите наименование товара',
      quantity: '0',
      clientNumber: 'Введите номер клиента',
    },
    imagePicker: {
      takePhoto: 'Сделать фото',
      fromGallery: 'Из галереи',
      photoCount: 'Фото',
      permissionsRequired: 'Требуются разрешения',
      permissionsMessage: 'Для работы приложения необходим доступ к камере и галерее',
      photoLimit: 'Лимит фото',
      photoLimitMessage: 'Максимум {max} фотографий',
      errorTitle: 'Ошибка',
      cameraError: 'Не удалось сделать фото',
      galleryError: 'Не удалось выбрать фото',
    },
    validation: {
      required: 'Это поле обязательно',
      invalidWeight: 'Введите корректный вес',
      invalidDimension: 'Введите корректный размер',
      invalidQuantity: 'Введите целое число',
      addPhoto: 'Добавьте хотя бы одно фото',
      validationError: 'Ошибка валидации',
      fillAllFields: 'Пожалуйста, заполните все поля правильно',
    },
    qr: {
      orderCreated: 'Заказ создан!',
      orderInfo: 'Информация о заказе',
      orderTitle: 'Заказ',
      printLabel: 'Печать этикетки',
      newOrder: 'Новый заказ',
      loading: 'Загрузка...',
      errorTitle: 'Ошибка',
      errorMessage: 'Не удалось загрузить данные заказа',
      printError: 'Ошибка печати',
      printErrorMessage: 'Не удалось распечатать QR-код',
    },
    upload: {
      uploadingPhotos: 'Загрузка фотографий...',
      uploadingPhoto: 'Загрузка фото {current} из {total}...',
      creatingOrder: 'Создание заказа...',
      errorTitle: 'Ошибка',
      errorMessage: 'Не удалось создать заказ. Проверьте подключение к интернету и попробуйте снова.',
    },
    language: {
      select: 'Язык',
      russian: 'Русский',
      chinese: '中文',
    },
    orders: {
      title: 'Заказы',
      empty: 'Заказов пока нет',
      emptyHint: 'Создайте первый заказ во вкладке Вставка',
    },
    tabs: {
      insert: 'Вставка',
      orders: 'Заказы',
      language: 'Язык',
      dashboard: 'Дашборд',
    },
    dashboard: {
      title: 'Дашборд заказов',
      loading: 'Загрузка заказов...',
      errorTitle: 'Ошибка',
      errorMessage: 'Не удалось загрузить заказы',
      empty: 'Нет заказов',
      refresh: 'Обновить',
      exportExcel: 'Экспорт Excel',
      deleteSelected: 'Удалить выбранное',
      deleteConfirmTitle: 'Подтвердить удаление',
      deleteConfirmMessage: 'Удалить выбранные заказы? Это действие нельзя отменить.',
      saveError: 'Не удалось сохранить изменения',
      deleteError: 'Не удалось удалить заказы',
      webOnlyTitle: 'Дашборд доступен только в браузере',
      webOnlyMessage: 'Откройте это приложение на компьютере, чтобы управлять заказами как в таблице.',
      openInBrowser: 'Открыть в браузере',
    },
  },
  zh: {
    app: {
      title: '订单处理',
      subtitle: '仓库',
    },
    form: {
      clientArticle: '货号',
      weight: '重量 (kg)',
      dimensions: '尺寸 (cm)',
      cubicMeters: '体积 (m³)',
      productName: '产品名称',
      quantity: '箱内数量',
      clientNumber: '客户编号',
      photos: '产品照片',
      submit: '生成二维码',
      required: '*',
      date: '日期',
    },
    placeholders: {
      clientArticle: '请输入货号',
      weight: '0.00',
      productName: '请输入产品名称',
      quantity: '0',
      clientNumber: '请输入客户编号',
    },
    imagePicker: {
      takePhoto: '拍照',
      fromGallery: '从相册选择',
      photoCount: '照片',
      permissionsRequired: '需要权限',
      permissionsMessage: '应用需要访问相机和相册的权限',
      photoLimit: '照片限制',
      photoLimitMessage: '最多 {max} 张照片',
      errorTitle: '错误',
      cameraError: '无法拍照',
      galleryError: '无法选择照片',
    },
    validation: {
      required: '此字段为必填项',
      invalidWeight: '请输入正确的重量',
      invalidDimension: '请输入正确的尺寸',
      invalidQuantity: '请输入整数',
      addPhoto: '请至少添加一张照片',
      validationError: '验证错误',
      fillAllFields: '请正确填写所有字段',
    },
    qr: {
      orderCreated: '订单已创建！',
      orderInfo: '订单信息',
      orderTitle: '订单',
      printLabel: '打印标签',
      newOrder: '新订单',
      loading: '加载中...',
      errorTitle: '错误',
      errorMessage: '无法加载订单数据',
      printError: '打印错误',
      printErrorMessage: '无法打印二维码',
    },
    upload: {
      uploadingPhotos: '正在上传照片...',
      uploadingPhoto: '正在上传照片 {current}/{total}...',
      creatingOrder: '正在创建订单...',
      errorTitle: '错误',
      errorMessage: '无法创建订单。请检查网络连接后重试。',
    },
    language: {
      select: '语言',
      russian: 'Русский',
      chinese: '中文',
    },
    orders: {
      title: '订单',
      empty: '还没有订单',
      emptyHint: '在插入标签中创建您的第一个订单',
    },
    tabs: {
      insert: '插入',
      orders: '订单',
      language: '语言',
      dashboard: '仪表盘',
    },
    dashboard: {
      title: '订单仪表盘',
      loading: '加载订单中...',
      errorTitle: '错误',
      errorMessage: '无法加载订单',
      empty: '没有订单',
      refresh: '刷新',
      exportExcel: '导出 Excel',
      deleteSelected: '删除选中项',
      deleteConfirmTitle: '确认删除',
      deleteConfirmMessage: '删除选中的订单？此操作无法撤销。',
      saveError: '无法保存更改',
      deleteError: '无法删除订单',
      webOnlyTitle: '仪表盘仅在浏览器中可用',
      webOnlyMessage: '请在电脑上打开此应用以表格形式管理订单。',
      openInBrowser: '在浏览器中打开',
    },
  },
};

export const formatString = (template: string, params: Record<string, string | number>): string => {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key]?.toString() || match;
  });
};
