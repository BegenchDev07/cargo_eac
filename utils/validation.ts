import { OrderFormData } from '../lib/types/order';
import { Translations } from '../lib/i18n/translations';

export interface ValidationErrors {
  client_article?: string;
  weight?: string;
  dimension_x?: string;
  dimension_y?: string;
  dimension_z?: string;
  product_name?: string;
  quantity?: string;
  client_number?: string;
  cargo_type?: string;
  images?: string;
}

export const validateOrderForm = (formData: OrderFormData, t: Translations): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!formData.client_article.trim()) {
    errors.client_article = t.validation.required;
  }

  if (!formData.weight.trim()) {
    errors.weight = t.validation.required;
  } else {
    const weightNum = parseFloat(formData.weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      errors.weight = t.validation.invalidWeight;
    }
  }

  if (!formData.dimension_x.trim()) {
    errors.dimension_x = t.validation.required;
  } else {
    const dimX = parseFloat(formData.dimension_x);
    if (isNaN(dimX) || dimX <= 0) {
      errors.dimension_x = t.validation.invalidDimension;
    }
  }

  if (!formData.dimension_y.trim()) {
    errors.dimension_y = t.validation.required;
  } else {
    const dimY = parseFloat(formData.dimension_y);
    if (isNaN(dimY) || dimY <= 0) {
      errors.dimension_y = t.validation.invalidDimension;
    }
  }

  if (!formData.dimension_z.trim()) {
    errors.dimension_z = t.validation.required;
  } else {
    const dimZ = parseFloat(formData.dimension_z);
    if (isNaN(dimZ) || dimZ <= 0) {
      errors.dimension_z = t.validation.invalidDimension;
    }
  }

  if (!formData.product_name.trim()) {
    errors.product_name = t.validation.required;
  }

  if (!formData.quantity.trim()) {
    errors.quantity = t.validation.required;
  } else {
    const quantityNum = parseInt(formData.quantity, 10);
    if (isNaN(quantityNum) || quantityNum <= 0 || !Number.isInteger(quantityNum)) {
      errors.quantity = t.validation.invalidQuantity;
    }
  }

  if (!formData.client_number.trim()) {
    errors.client_number = t.validation.required;
  }

  if (formData.images.length === 0) {
    errors.images = t.validation.addPhoto;
  }

  return errors;
};

export const hasValidationErrors = (errors: ValidationErrors): boolean => {
  return Object.keys(errors).length > 0;
};
