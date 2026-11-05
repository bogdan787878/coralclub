/**
 * The words of the checkout parts that are not data. English by default (the
 * friend project); a storefront in another language passes its own set through
 * the `labels` prop of each part.
 */
export type PickupLabels = {
  title: string;
  close: string;
  loadingMap: string;
  mapFailed: string;
  map: string;
  list: string;
  empty: string;
  findAddress: string;
  notFound: string;
  choose: string;
  chosen: string;
  fallbackService: string;
};
export const PICKUP_EN: PickupLabels = {
  title: "Pick-up point",
  close: "Close",
  loadingMap: "Loading the map…",
  mapFailed: "The map could not be loaded. Use the list instead.",
  map: "Map",
  list: "List",
  empty: "No pick-up points match.",
  findAddress: "Find address",
  notFound: "We could not find this address.",
  choose: "Choose",
  chosen: "Chosen",
  fallbackService: "Pick-up",
};
export const PICKUP_RU: PickupLabels = {
  title: "Пункт выдачи",
  close: "Закрыть",
  loadingMap: "Загружаем карту…",
  mapFailed: "Карту загрузить не удалось. Выберите пункт в списке.",
  map: "Карта",
  list: "Список",
  empty: "Подходящих пунктов выдачи нет.",
  findAddress: "Найти адрес",
  notFound: "Не получилось найти этот адрес.",
  choose: "Выбрать",
  chosen: "Выбран",
  fallbackService: "Самовывоз",
};

export type MapLabels = {
  title: string;
  close: string;
  loadingMap: string;
  mapFailed: string;
  prompt: string;
  wrongCountry: (country: string) => string;
  noNumber: string;
  confirm: string;
};
export const MAP_EN: MapLabels = {
  title: "Choose on map",
  close: "Close",
  loadingMap: "Loading the map…",
  mapFailed: "The map could not be loaded. Search for the address instead.",
  prompt: "Move the map to your building",
  wrongCountry: (country) => `This point is not in ${country}. Move the pin or change the country in the header.`,
  noNumber: "There is no house number here: zoom in and put the pin on a building.",
  confirm: "Confirm address",
};
export const MAP_RU: MapLabels = {
  title: "Выбрать на карте",
  close: "Закрыть",
  loadingMap: "Загружаем карту…",
  mapFailed: "Карту загрузить не удалось. Найдите адрес поиском.",
  prompt: "Переместите карту к вашему дому",
  wrongCountry: (country) => `Эта точка не в стране «${country}». Передвиньте метку или смените страну вверху страницы.`,
  noNumber: "Здесь нет номера дома: приблизьте карту и поставьте метку на здание.",
  confirm: "Подтвердить адрес",
};

export type CountryLabels = {
  aria: (country: string) => string;
  search: string;
  empty: string;
  list: string;
};
export const COUNTRY_EN: CountryLabels = {
  aria: (country) => `Country: ${country}. Change country`,
  search: "Search country",
  empty: "Nothing found.",
  list: "Countries",
};
export const COUNTRY_RU: CountryLabels = {
  aria: (country) => `Страна: ${country}. Сменить страну`,
  search: "Найти страну",
  empty: "Ничего не найдено.",
  list: "Страны",
};
