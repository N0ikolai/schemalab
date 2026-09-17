export const PRESETS = [
  {
    id: 'voltage-divider',
    nameUk: 'Подільник напруги',
    circuit: {
      components: [
        { id: 'bat1', kind: 'battery', x: 200, y: 260, rotation: 270, value: 12, label: 'V1 (12В)' },
        { id: 'r1', kind: 'resistor', x: 360, y: 200, rotation: 90, value: 1000, label: 'R1 (1 кОм)' },
        { id: 'r2', kind: 'resistor', x: 360, y: 320, rotation: 90, value: 1000, label: 'R2 (1 кОм)' },
        { id: 'vm1', kind: 'voltmeter', x: 500, y: 320, rotation: 90, value: 0, label: 'Vвих' },
        { id: 'gnd1', kind: 'ground', x: 360, y: 420, rotation: 0, value: 0, label: 'GND' },
      ],
      wires: [
        { id: 'w1', from: { componentId: 'bat1', pinIndex: 0 }, to: { componentId: 'r1', pinIndex: 0 } },
        { id: 'w2', from: { componentId: 'r1', pinIndex: 1 }, to: { componentId: 'r2', pinIndex: 0 } },
        { id: 'w3', from: { componentId: 'r2', pinIndex: 1 }, to: { componentId: 'gnd1', pinIndex: 0 } },
        { id: 'w4', from: { componentId: 'bat1', pinIndex: 1 }, to: { componentId: 'gnd1', pinIndex: 0 } },
        { id: 'w5', from: { componentId: 'vm1', pinIndex: 0 }, to: { componentId: 'r1', pinIndex: 1 } },
        { id: 'w6', from: { componentId: 'vm1', pinIndex: 1 }, to: { componentId: 'gnd1', pinIndex: 0 } },
      ],
    },
  },
  {
    id: 'led-circuit',
    nameUk: 'Світлодіод із резистором',
    circuit: {
      components: [
        { id: 'bat1', kind: 'battery', x: 180, y: 260, rotation: 270, value: 9, label: 'Батарея 9В' },
        { id: 'am1', kind: 'ammeter', x: 300, y: 180, rotation: 0, value: 0, label: 'I_кола' },
        { id: 'r1', kind: 'resistor', x: 440, y: 180, rotation: 0, value: 330, label: 'R1 (330 Ом)' },
        { id: 'led1', kind: 'led', x: 540, y: 260, rotation: 90, value: 2.0, label: 'Червоний LED', ledColor: 'red' },
        { id: 'gnd1', kind: 'ground', x: 360, y: 380, rotation: 0, value: 0, label: 'GND' },
      ],
      wires: [
        { id: 'w1', from: { componentId: 'bat1', pinIndex: 0 }, to: { componentId: 'am1', pinIndex: 0 } },
        { id: 'w2', from: { componentId: 'am1', pinIndex: 1 }, to: { componentId: 'r1', pinIndex: 0 } },
        { id: 'w3', from: { componentId: 'r1', pinIndex: 1 }, to: { componentId: 'led1', pinIndex: 0 } },
        { id: 'w4', from: { componentId: 'led1', pinIndex: 1 }, to: { componentId: 'gnd1', pinIndex: 0 } },
        { id: 'w5', from: { componentId: 'bat1', pinIndex: 1 }, to: { componentId: 'gnd1', pinIndex: 0 } },
      ],
    },
  },
  {
    id: 'parallel-resistors',
    nameUk: 'Паралельні резистори',
    circuit: {
      components: [
        { id: 'bat1', kind: 'battery', x: 180, y: 260, rotation: 270, value: 12, label: 'V1 (12В)' },
        { id: 'r1', kind: 'resistor', x: 340, y: 260, rotation: 90, value: 200, label: 'R1 (200 Ом)' },
        { id: 'r2', kind: 'resistor', x: 460, y: 260, rotation: 90, value: 300, label: 'R2 (300 Ом)' },
        { id: 'gnd1', kind: 'ground', x: 340, y: 380, rotation: 0, value: 0, label: 'GND' },
      ],
      wires: [
        { id: 'w1', from: { componentId: 'bat1', pinIndex: 0 }, to: { componentId: 'r1', pinIndex: 0 } },
        { id: 'w2', from: { componentId: 'r1', pinIndex: 0 }, to: { componentId: 'r2', pinIndex: 0 } },
        { id: 'w3', from: { componentId: 'bat1', pinIndex: 1 }, to: { componentId: 'gnd1', pinIndex: 0 } },
        { id: 'w4', from: { componentId: 'r1', pinIndex: 1 }, to: { componentId: 'gnd1', pinIndex: 0 } },
        { id: 'w5', from: { componentId: 'r2', pinIndex: 1 }, to: { componentId: 'gnd1', pinIndex: 0 } },
      ],
    },
  },
];