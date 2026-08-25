export type Language = 'ru' | 'zh';

export interface Translations {
  app: {
    title: string;
    subtitle: string;
  };
  form: {
    customerName: string;
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
    cargoType: string;
  };
  placeholders: {
    customerName: string;
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
    edit: string;
    save: string;
    cancel: string;
    editOrder: string;
    editSuccess: string;
    editError: string;
  };
  tabs: {
    insert: string;
    orders: string;
    language: string;
    dashboard: string;
    freights: string;
  };
  freights: {
    title: string;
    createFreight: string;
    empty: string;
    orders: string;
    noOrders: string;
    status: {
      open: string;
      closed: string;
      shipped: string;
    };
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
    saving: string;
    saved: string;
    saveError: string;
    deleteError: string;
    removeFromFreight: string;
    removeFromFreightError: string;
    cargoType: string;
    cargoTypes: {
      dangerous: string;
      liquid: string;
      brand: string;
      standard: string;
    };
    price: string;
    article: string;
    freight: string;
    freightNumber: string;
    assignToFreight: string;
    assignFreightError: string;
    createFreight: string;
    createFreightError: string;
    existingFreight: string;
    newFreight: string;
    selectFreight: string;
    loadDate: string;
    notes: string;
    exportAll: string;
    exportFiltered: string;
    exportSelected: string;
    cancel: string;
    confirm: string;
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
      customerName: 'Имя клиента',
      weight: 'Вес (кг)',
      dimensions: 'Размеры (см)',
      cubicMeters: 'Объём (м³)',
      productName: 'Наименование',
      quantity: 'Количество коробок',
      clientNumber: 'Номер клиента',
      photos: 'Фотографии товара',
      submit: 'Создать QR-код',
      required: '*',
      date: 'Дата',
      cargoType: 'Тип груза',
    },
    placeholders: {
      customerName: 'Введите имя клиента',
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
      edit: 'Редактировать',
      save: 'Сохранить',
      cancel: 'Отмена',
      editOrder: 'Редактировать заказ',
      editSuccess: 'Заказ обновлён',
      editError: 'Не удалось обновить заказ',
    },
    tabs: {
      insert: 'Вставка',
      orders: 'Заказы',
      language: 'Язык',
      dashboard: 'Дашборд',
      freights: 'Фрахты',
    },
    freights: {
      title: 'Фрахты',
      createFreight: 'Создать фрахт',
      empty: 'Нет фрахтов',
      orders: 'заказов',
      noOrders: 'В этом фрахте пока нет заказов',
      status: {
        open: 'Открыт',
        closed: 'Закрыт',
        shipped: 'Отправлен',
      },
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
      saving: 'Сохранение...',
      saved: 'Сохранено',
      saveError: 'Не удалось сохранить изменения',
      deleteError: 'Не удалось удалить заказы',
      removeFromFreight: 'Убрать из фрахта',
      removeFromFreightError: 'Не удалось убрать заказы из фрахта',
      cargoType: 'Тип груза',
      cargoTypes: {
        dangerous: 'Опасный',
        liquid: 'Жидкость',
        brand: 'Брендовый',
        standard: 'Стандартный',
      },
      price: 'Стоимость',
      article: 'Артикул',
      freight: 'Фрахт',
      freightNumber: 'Номер фрахта',
      assignToFreight: 'В фрахт',
      assignFreightError: 'Не удалось назначить заказы в фрахт',
      createFreight: 'Создать фрахт',
      createFreightError: 'Не удалось создать фрахт',
      existingFreight: 'Существующий',
      newFreight: 'Новый',
      selectFreight: 'Выберите фрахт',
      loadDate: 'Дата погрузки',
      notes: 'Примечания',
      exportAll: 'Все строки',
      exportFiltered: 'Отфильтрованные',
      exportSelected: 'Выбранные',
      cancel: 'Отмена',
      confirm: 'Подтвердить',
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
      customerName: '客户姓名',
      weight: '重量 (kg)',
      dimensions: '尺寸 (cm)',
      cubicMeters: '体积 (m³)',
      productName: '产品名称',
      quantity: '箱数',
      clientNumber: '客户编号',
      photos: '产品照片',
      submit: '生成二维码',
      required: '*',
      date: '日期',
      cargoType: '货物类型',
    },
    placeholders: {
      customerName: '请输入客户姓名',
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
      edit: '编辑',
      save: '保存',
      cancel: '取消',
      editOrder: '编辑订单',
      editSuccess: '订单已更新',
      editError: '无法更新订单',
    },
    tabs: {
      insert: '插入',
      orders: '订单',
      language: '语言',
      dashboard: '仪表盘',
      freights: '货运',
    },
    freights: {
      title: '货运',
      createFreight: '创建货运',
      empty: '没有货运',
      orders: '订单',
      noOrders: '此货运中暂无订单',
      status: {
        open: '开放',
        closed: '关闭',
        shipped: '已发货',
      },
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
      saving: '保存中...',
      saved: '已保存',
      saveError: '无法保存更改',
      deleteError: '无法删除订单',
      removeFromFreight: '从货运中移除',
      removeFromFreightError: '无法将订单从货运中移除',
      cargoType: '货物类型',
      cargoTypes: {
        dangerous: '危险品',
        liquid: '液体',
        brand: '品牌货',
        standard: '标准货',
      },
      price: '价格',
      article: '货号',
      freight: '货运',
      freightNumber: '货运编号',
      assignToFreight: '分配到货运',
      assignFreightError: '无法将订单分配到货运',
      createFreight: '创建货运',
      createFreightError: '无法创建货运',
      existingFreight: '现有',
      newFreight: '新建',
      selectFreight: '选择货运',
      loadDate: '装货日期',
      notes: '备注',
      exportAll: '全部',
      exportFiltered: '已筛选',
      exportSelected: '已选择',
      cancel: '取消',
      confirm: '确认',
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
