"use server";

import type { FormActionState } from "@/server/form-state";

import {
  archiveProductAction as archiveProductActionInternal,
  createProductAction as createProductActionInternal,
  importProductsAction as importProductsActionInternal,
  restoreProductAction as restoreProductActionInternal,
  updateProductAction as updateProductActionInternal,
} from "@/server/master-data/products";

export async function createProductAction(
  prevState: FormActionState,
  formData: FormData,
) {
  return createProductActionInternal(prevState, formData);
}

export async function updateProductAction(
  prevState: FormActionState,
  formData: FormData,
) {
  return updateProductActionInternal(prevState, formData);
}

export async function importProductsAction(
  prevState: FormActionState,
  formData: FormData,
) {
  return importProductsActionInternal(prevState, formData);
}

export async function archiveProductAction(formData: FormData) {
  return archiveProductActionInternal(formData);
}

export async function restoreProductAction(formData: FormData) {
  return restoreProductActionInternal(formData);
}
