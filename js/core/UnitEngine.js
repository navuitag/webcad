/**
 * UnitEngine — đơn vị hiển thị và quy đổi kích thước
 */
class UnitEngine {
  static UNITS = {
    mm: { label: 'mm', toMm: 1 },
    cm: { label: 'cm', toMm: 10 },
    m: { label: 'm', toMm: 1000 },
    in: { label: 'in', toMm: 25.4 }
  };

  static LIST = ['mm', 'cm', 'm', 'in'];

  static toDisplay(worldValue, worldUnit = 'mm', displayUnit = 'mm') {
    const w = UnitEngine.UNITS[worldUnit] || UnitEngine.UNITS.mm;
    const d = UnitEngine.UNITS[displayUnit] || UnitEngine.UNITS.mm;
    return worldValue * (w.toMm / d.toMm);
  }

  static fromDisplay(displayValue, worldUnit = 'mm', displayUnit = 'mm') {
    const w = UnitEngine.UNITS[worldUnit] || UnitEngine.UNITS.mm;
    const d = UnitEngine.UNITS[displayUnit] || UnitEngine.UNITS.mm;
    return displayValue * (d.toMm / w.toMm);
  }

  static format(worldValue, displayUnit = 'mm', worldUnit = 'mm', decimals = 2) {
    const v = UnitEngine.toDisplay(worldValue, worldUnit, displayUnit);
    const label = UnitEngine.UNITS[displayUnit]?.label || displayUnit;
    return v.toFixed(decimals) + ' ' + label;
  }

  static formatArea(worldArea, displayUnit = 'mm', worldUnit = 'mm', decimals = 2) {
    const linear = UnitEngine.toDisplay(Math.sqrt(worldArea), worldUnit, displayUnit);
    const area = linear * linear;
    const label = UnitEngine.UNITS[displayUnit]?.label || displayUnit;
    return area.toFixed(decimals) + ' ' + label + '²';
  }
}
