import type { Service } from "../types/database";

export const VISTAPRINT_LOGO_URL =
  "https://cms.cloudinary.vpsvc.com/image/upload/c_scale,dpr_auto,w_auto/India%20LOB/VistaprintLogo.svg";

export function isVistaprintService(service: Service | null | undefined) {
  return service?.supplier === "vistaprint" || service?.category.startsWith("vistaprint_") || false;
}

export function displayServicePrice(service: Service) {
  if (isVistaprintService(service) && service.base_price === 0 && service.print_price === 0) {
    return "Quote after final design";
  }

  return `Rs. ${service.base_price}`;
}
