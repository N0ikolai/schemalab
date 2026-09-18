export const GRID_SIZE = 20;

export const COMPONENT_CATALOG = {
  resistor: {
    kind: 'resistor', nameUk: 'Резистор', defaultLabelPrefix: 'R', defaultValue: 1000, unit: 'Ом',
    pins: [{ index: 0, x: -30, y: 0, label: '1' }, { index: 1, x: 30, y: 0, label: '2' }],
    descriptionUk: 'Пасивний опір струму, закон Ома: U = I * R',
  },
  battery: {
    kind: 'battery', nameUk: 'Джерело DC', defaultLabelPrefix: 'V', defaultValue: 9, unit: 'В',
    pins: [{ index: 0, x: -30, y: 0, label: '+' }, { index: 1, x: 30, y: 0, label: '-' }],
    descriptionUk: 'Джерело постійної електрорушійної сили (DC)',
  },
  ac_source: {
    kind: 'ac_source', nameUk: 'Генератор AC', defaultLabelPrefix: 'VAC', defaultValue: 12, unit: 'В',
    pins: [{ index: 0, x: -30, y: 0, label: 'L' }, { index: 1, x: 30, y: 0, label: 'N' }],
    descriptionUk: 'Джерело змінної напруги (Синусоїда)',
  },
  ground: {
    kind: 'ground', nameUk: 'Земля (GND)', defaultLabelPrefix: 'GND', defaultValue: 0, unit: 'В',
    pins: [{ index: 0, x: 0, y: -20, label: 'GND' }],
    descriptionUk: 'Опорний нульовий потенціал схеми (0 В)',
  },
  switch: {
    kind: 'switch', nameUk: 'Вимикач', defaultLabelPrefix: 'SW', defaultValue: 0, unit: '',
    pins: [{ index: 0, x: -30, y: 0, label: '1' }, { index: 1, x: 30, y: 0, label: '2' }],
    descriptionUk: 'Комутатор струму. Замкнений = 0 Ом, розімкнений = нескінченність',
  },
  led: {
    kind: 'led', nameUk: 'Світлодіод', defaultLabelPrefix: 'LED', defaultValue: 2.0, unit: 'В',
    pins: [{ index: 0, x: -30, y: 0, label: 'A (+)' }, { index: 1, x: 30, y: 0, label: 'K (-)' }],
    descriptionUk: 'Діод з падінням напруги Vf та свіченням',
  },
  diode: {
    kind: 'diode', nameUk: 'Діод', defaultLabelPrefix: 'D', defaultValue: 0.7, unit: 'В',
    pins: [{ index: 0, x: -30, y: 0, label: 'A (+)' }, { index: 1, x: 30, y: 0, label: 'K (-)' }],
    descriptionUk: 'Звичайний кремнієвий діод (для цифрової логіки)',
  },
  relay: {
    kind: 'relay', nameUk: 'Реле', defaultLabelPrefix: 'K', defaultValue: 3.0, unit: 'В',
    pins: [
      { index: 0, x: -20, y: -20, label: 'C+' }, { index: 1, x: -20, y: 20, label: 'C-' },
      { index: 2, x: 20, y: -20, label: 'SW1' }, { index: 3, x: 20, y: 20, label: 'SW2' }
    ],
    descriptionUk: 'Електромагнітне реле. Замикає контакти SW, якщо напруга на котушці C >= номіналу.',
  },
  npn: {
    kind: 'npn', nameUk: 'NPN Транзистор', defaultLabelPrefix: 'Q', defaultValue: 100, unit: 'hFE',
    pins: [
      { index: 0, x: -20, y: 0, label: 'B' }, 
      { index: 1, x: 20, y: -20, label: 'C' },
      { index: 2, x: 20, y: 20, label: 'E' }  
    ],
    descriptionUk: 'Біполярний транзистор (цифрова макромодель ключового режиму)',
  },
  voltmeter: {
    kind: 'voltmeter', nameUk: 'Вольтметр', defaultLabelPrefix: 'VM', defaultValue: 0, unit: 'В',
    pins: [{ index: 0, x: -30, y: 0, label: '+' }, { index: 1, x: 30, y: 0, label: '-' }],
    descriptionUk: 'Прилад для вимірювання різниці потенціалів',
  },
  ammeter: {
    kind: 'ammeter', nameUk: 'Амперметр', defaultLabelPrefix: 'AM', defaultValue: 0, unit: 'А',
    pins: [{ index: 0, x: -30, y: 0, label: '+' }, { index: 1, x: 30, y: 0, label: '-' }],
    descriptionUk: 'Прилад для вимірювання струму в розриві кола',
  },
};