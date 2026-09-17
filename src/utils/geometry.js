import { COMPONENT_CATALOG } from '../constants/componentCatalog.js';

export function getPinWorldPosition(component, pinIndex) {
  const meta = COMPONENT_CATALOG[component.kind];
  const pinDef = meta.pins.find((p) => p.index === pinIndex) || { index: 0, x: 0, y: 0, label: '' };
  const rad = (component.rotation * Math.PI) / 180;
  const cos = Math.round(Math.cos(rad));
  const sin = Math.round(Math.sin(rad));
  return {
    x: component.x + (pinDef.x * cos - pinDef.y * sin),
    y: component.y + (pinDef.x * sin + pinDef.y * cos),
  };
}