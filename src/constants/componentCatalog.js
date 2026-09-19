export const GRID_SIZE = 20;

export const COMPONENT_CATALOG = {
  resistor: {
    category: 'passive', kind: 'resistor', nameUk: 'Резистор', defaultLabelPrefix: 'R', defaultValue: 1000, unit: 'Ом',
    pins: [{ index: 0, x: -30, y: 0, label: '1' }, { index: 1, x: 30, y: 0, label: '2' }],
    descriptionUk: 'Пасивний опір струму, закон Ома: U = I * R',
  },
  capacitor: {
    category: 'passive', kind: 'capacitor', nameUk: 'Конденсатор', defaultLabelPrefix: 'C', defaultValue: 0.001, unit: 'Ф',
    pins: [{ index: 0, x: -30, y: 0, label: '1' }, { index: 1, x: 30, y: 0, label: '2' }],
    descriptionUk: 'Накопичує заряд (реактивний елемент)',
  },
  inductor: {
    category: 'passive', kind: 'inductor', nameUk: 'Котушка', defaultLabelPrefix: 'L', defaultValue: 1, unit: 'Гн',
    pins: [{ index: 0, x: -30, y: 0, label: '1' }, { index: 1, x: 30, y: 0, label: '2' }],
    descriptionUk: 'Накопичує магнітну енергію (реактивний елемент)',
  },
  battery: {
    category: 'source', kind: 'battery', nameUk: 'Джерело DC', defaultLabelPrefix: 'V', defaultValue: 9, unit: 'В',
    pins: [{ index: 0, x: -30, y: 0, label: '+' }, { index: 1, x: 30, y: 0, label: '-' }],
    descriptionUk: 'Джерело постійної електрорушійної сили (DC)',
  },
  ac_source: {
    category: 'source', kind: 'ac_source', nameUk: 'Генератор AC', defaultLabelPrefix: 'VAC', defaultValue: 12, unit: 'В',
    pins: [{ index: 0, x: -30, y: 0, label: 'L' }, { index: 1, x: 30, y: 0, label: 'N' }],
    descriptionUk: 'Джерело змінної напруги (Синусоїда)',
  },
  ground: {
    category: 'source', kind: 'ground', nameUk: 'Земля (GND)', defaultLabelPrefix: 'GND', defaultValue: 0, unit: 'В',
    pins: [{ index: 0, x: 0, y: -20, label: 'GND' }],
    descriptionUk: 'Опорний нульовий потенціал схеми (0 В)',
  },
  vcc: {
    category: 'logic', kind: 'vcc', nameUk: 'Логічна 1 (+Vcc)', defaultLabelPrefix: 'VCC', defaultValue: 5, unit: 'В',
    pins: [{ index: 0, x: 0, y: 20, label: 'OUT' }],
    descriptionUk: 'Джерело стабільних 5В для цифрових схем',
  },
  jk_ff: {
    category: 'logic', kind: 'jk_ff', nameUk: 'JK-тригер', defaultLabelPrefix: 'JK', defaultValue: 0, unit: '',
    pins: [
      { index: 0, x: -30, y: -20, label: 'J' },
      { index: 1, x: -30, y: 0, label: 'C' },
      { index: 2, x: -30, y: 20, label: 'K' },
      { index: 3, x: 30, y: -20, label: 'Q' },
      { index: 4, x: 30, y: 20, label: '!Q' }
    ],
    descriptionUk: 'Синхронний JK-тригер. Змінює стан по передньому фронту (0 -> 1) на вході C.',
  },
  adder: {
    category: 'logic', kind: 'adder', nameUk: 'Повний суматор', defaultLabelPrefix: 'ADD', defaultValue: 0, unit: '',
    pins: [
      { index: 0, x: -30, y: -20, label: 'A' },
      { index: 1, x: -30, y: 0, label: 'B' },
      { index: 2, x: -30, y: 20, label: 'Cin' },
      { index: 3, x: 30, y: -10, label: 'S' },
      { index: 4, x: 30, y: 10, label: 'Cout' }
    ],
    descriptionUk: 'Двійковий повний суматор. Додає A, B та вхідний переніс (Cin). Видає суму (S) та переніс (Cout).',
  },
  clock: {
    category: 'logic', kind: 'clock', nameUk: 'Тактовий генератор', defaultLabelPrefix: 'CLK', defaultValue: 1, unit: 'Гц',
    pins: [{ index: 0, x: 0, y: -20, label: '+' }, { index: 1, x: 0, y: 20, label: '-' }],
    descriptionUk: 'Генератор прямокутних імпульсів (меандр 0..5В)',
  },
  and: {
    category: 'logic', kind: 'and', nameUk: 'Елемент І (AND)', defaultLabelPrefix: 'U', defaultValue: 0, unit: '',
    pins: [{ index: 0, x: -30, y: -10, label: 'IN1' }, { index: 1, x: -30, y: 10, label: 'IN2' }, { index: 2, x: 30, y: 0, label: 'OUT' }],
    descriptionUk: 'Видає 1 (5В), тільки якщо на обох входах 1.',
  },
  or: {
    category: 'logic', kind: 'or', nameUk: 'Елемент АБО (OR)', defaultLabelPrefix: 'U', defaultValue: 0, unit: '',
    pins: [{ index: 0, x: -30, y: -10, label: 'IN1' }, { index: 1, x: -30, y: 10, label: 'IN2' }, { index: 2, x: 30, y: 0, label: 'OUT' }],
    descriptionUk: 'Видає 1 (5В), якщо хоча б на одному вході 1.',
  },
  not: {
    category: 'logic', kind: 'not', nameUk: 'Елемент НЕ (NOT)', defaultLabelPrefix: 'U', defaultValue: 0, unit: '',
    pins: [{ index: 0, x: -30, y: 0, label: 'IN' }, { index: 1, x: 30, y: 0, label: 'OUT' }],
    descriptionUk: 'Інвертор. Видає 1, якщо на вході 0, і навпаки.',
  },
  nor: {
    category: 'logic', kind: 'nor', nameUk: 'Елемент АБО-НЕ (NOR)', defaultLabelPrefix: 'U', defaultValue: 0, unit: '',
    pins: [{ index: 0, x: -30, y: -10, label: 'IN1' }, { index: 1, x: -30, y: 10, label: 'IN2' }, { index: 2, x: 30, y: 0, label: 'OUT' }],
    descriptionUk: 'Видає 1, тільки якщо на обох входах 0.',
  },
  switch: {
    category: 'logic', kind: 'switch', nameUk: 'Вимикач', defaultLabelPrefix: 'SW', defaultValue: 0, unit: '',
    pins: [{ index: 0, x: -30, y: 0, label: '1' }, { index: 1, x: 30, y: 0, label: '2' }],
    descriptionUk: 'Комутатор струму.',
  },
  led: {
    category: 'logic', kind: 'led', nameUk: 'Світлодіод', defaultLabelPrefix: 'LED', defaultValue: 2.0, unit: 'В',
    pins: [{ index: 0, x: -30, y: 0, label: 'A (+)' }, { index: 1, x: 30, y: 0, label: 'K (-)' }],
    descriptionUk: 'Діод з падінням напруги Vf та свіченням',
  },
  probe: {
    category: 'measure', kind: 'probe', nameUk: 'Логічний пробник', defaultLabelPrefix: 'PRB', defaultValue: 0, unit: '',
    pins: [{ index: 0, x: -20, y: 0, label: 'IN' }],
    descriptionUk: 'Реагує на логічні рівні (світиться при U > 2.5В)',
  },
  voltmeter: {
    category: 'measure', kind: 'voltmeter', nameUk: 'Вольтметр', defaultLabelPrefix: 'VM', defaultValue: 0, unit: 'В',
    pins: [{ index: 0, x: -30, y: 0, label: '+' }, { index: 1, x: 30, y: 0, label: '-' }],
    descriptionUk: 'Прилад для вимірювання різниці потенціалів',
  },
  ammeter: {
    category: 'measure', kind: 'ammeter', nameUk: 'Амперметр', defaultLabelPrefix: 'AM', defaultValue: 0, unit: 'А',
    pins: [{ index: 0, x: -30, y: 0, label: '+' }, { index: 1, x: 30, y: 0, label: '-' }],
    descriptionUk: 'Прилад для вимірювання струму в розриві кола',
  },
};