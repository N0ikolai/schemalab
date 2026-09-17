export const GRID_SIZE = 20;

export const COMPONENT_CATALOG = {
  resistor: {
    kind: 'resistor',
    nameUk: 'Резистор',
    defaultLabelPrefix: 'R',
    defaultValue: 1000,
    unit: 'Ом',
    pins: [
      { index: 0, x: -30, y: 0, label: '1' },
      { index: 1, x: 30, y: 0, label: '2' },
    ],
    descriptionUk: 'Пасивний опір струму, закон Ома: U = I * R',
  },
  battery: {
    kind: 'battery',
    nameUk: 'Джерело напруги',
    defaultLabelPrefix: 'V',
    defaultValue: 9,
    unit: 'В',
    pins: [
      { index: 0, x: -30, y: 0, label: '+' },
      { index: 1, x: 30, y: 0, label: '-' },
    ],
    descriptionUk: 'Джерело постійної електрорушійної сили (DC)',
  },
  ground: {
    kind: 'ground',
    nameUk: 'Земля (GND)',
    defaultLabelPrefix: 'GND',
    defaultValue: 0,
    unit: 'В',
    pins: [
      { index: 0, x: 0, y: -20, label: 'GND' },
    ],
    descriptionUk: 'Опорний нульовий потенціал схеми (0 В)',
  },
  led: {
    kind: 'led',
    nameUk: 'Світлодіод',
    defaultLabelPrefix: 'LED',
    defaultValue: 2.0,
    unit: 'В',
    pins: [
      { index: 0, x: -30, y: 0, label: 'A (+)' },
      { index: 1, x: 30, y: 0, label: 'K (-)' },
    ],
    descriptionUk: 'Напівпровідниковий діод з падінням напруги Vf та свіченням',
  },
  voltmeter: {
    kind: 'voltmeter',
    nameUk: 'Вольтметр',
    defaultLabelPrefix: 'VM',
    defaultValue: 0,
    unit: 'В',
    pins: [
      { index: 0, x: -30, y: 0, label: '+' },
      { index: 1, x: 30, y: 0, label: '-' },
    ],
    descriptionUk: 'Прилад для вимірювання різниці потенціалів (R = 1 ГОм)',
  },
  ammeter: {
    kind: 'ammeter',
    nameUk: 'Амперметр',
    defaultLabelPrefix: 'AM',
    defaultValue: 0,
    unit: 'А',
    pins: [
      { index: 0, x: -30, y: 0, label: '+' },
      { index: 1, x: 30, y: 0, label: '-' },
    ],
    descriptionUk: 'Прилад для вимірювання струму в розриві кола (R = 0 Ом)',
  },
  switch: {
    kind: 'switch',
    nameUk: 'Вимикач',
    defaultLabelPrefix: 'SW',
    defaultValue: 0, // 0 - розімкнений, 1 - замкнений
    unit: '',
    pins: [
      { index: 0, x: -30, y: 0, label: '1' },
      { index: 1, x: 30, y: 0, label: '2' },
    ],
    descriptionUk: 'Комутатор струму. Замкнений = 0 Ом, розімкнений = нескінченність',
  },
};
