/**
 * BlockLibrary — thư viện mẫu kiến trúc & nội thất
 * Đơn vị: cm (90 = cửa 900mm)
 */
class BlockLibrary {
  static categories = {
    all: { label: 'Tất cả', icon: '📦' },
    house: { label: 'Kiến trúc', icon: '🏠' },
    door: { label: 'Cửa & CS', icon: '🚪' },
    furniture: { label: 'Nội thất', icon: '🛋️' },
    kitchen: { label: 'Bếp & tủ', icon: '🍳' },
    bath: { label: 'Phòng tắm', icon: '🚿' },
    stair: { label: 'Cầu thang', icon: '🪜' },
    mep: { label: 'Điện nước', icon: '⚡' },
    landscape: { label: 'Cảnh quan', icon: '🌳' },
    decor: { label: 'Trang trí', icon: '🖼️' }
  };

  static templates = {
    'wall-segment': {
      category: 'house', name: 'Tường 100mm', icon: '🧱', width: 100, height: 10,
      entities: (w) => [{
        type: 'HATCH',
        boundary: [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: 10 }, { x: 0, y: 10 }],
        pattern: 'SOLID'
      }]
    },
    'room-label': {
      category: 'house', name: 'Nhãn phòng', icon: '🏷️', width: 40, height: 10,
      entities: () => [{ type: 'TEXT', x: 0, y: 0, text: 'PHÒNG', height: 3 }]
    },
    'door-single': {
      category: 'door', name: 'Cửa đi 900', icon: '🚪', width: 90, height: 90,
      entities: () => [
        BlockLibrary._line(0, 0, 90, 0),
        { type: 'ARC', cx: 0, cy: 0, r: 90, startAngle: 0, endAngle: Math.PI / 2 }
      ]
    },
    'door-double': {
      category: 'door', name: 'Cửa đôi 1800', icon: '🚪', width: 180, height: 90,
      entities: () => [
        BlockLibrary._line(0, 0, 180, 0),
        { type: 'ARC', cx: 0, cy: 0, r: 90, startAngle: 0, endAngle: Math.PI / 2 },
        { type: 'ARC', cx: 180, cy: 0, r: 90, startAngle: Math.PI / 2, endAngle: Math.PI }
      ]
    },
    'door-sliding': {
      category: 'door', name: 'Cửa lùa 1800', icon: '↔️', width: 180, height: 8,
      entities: () => [
        BlockLibrary._rect(0, 0, 180, 4),
        BlockLibrary._line(0, 6, 180, 6),
        BlockLibrary._line(90, 0, 90, 4),
        BlockLibrary._line(0, 1, 85, 1),
        BlockLibrary._line(95, 1, 180, 1)
      ]
    },
    'door-pocket': {
      category: 'door', name: 'Cửa âm tường', icon: '🕳️', width: 90, height: 20,
      entities: () => [
        BlockLibrary._rect(0, 0, 90, 20),
        BlockLibrary._line(0, 0, 90, 0),
        BlockLibrary._line(10, 0, 10, 18),
        BlockLibrary._line(80, 0, 80, 18)
      ]
    },
    'window': {
      category: 'door', name: 'Cửa sổ 1200', icon: '🪟', width: 120, height: 8,
      entities: () => [
        BlockLibrary._line(0, 0, 120, 0),
        BlockLibrary._line(0, 5, 120, 5),
        BlockLibrary._line(60, 0, 60, 5)
      ]
    },
    'window-sliding': {
      category: 'door', name: 'Cửa sổ lùa', icon: '🪟', width: 180, height: 8,
      entities: () => [
        BlockLibrary._rect(0, 0, 180, 6),
        BlockLibrary._line(0, 0, 180, 0),
        BlockLibrary._line(90, 0, 90, 6),
        BlockLibrary._line(0, 3, 85, 3),
        BlockLibrary._line(95, 3, 180, 3)
      ]
    },
    'window-bay': {
      category: 'door', name: 'Cửa sổ vát', icon: '🪟', width: 180, height: 60,
      entities: () => [
        BlockLibrary._rect(0, 0, 180, 6),
        BlockLibrary._rect(0, 0, 6, 50),
        BlockLibrary._rect(174, 0, 180, 50),
        BlockLibrary._rect(40, 50, 140, 60)
      ]
    },
    'table-dining': {
      category: 'furniture', name: 'Bàn ăn 120×80', icon: '🍽️', width: 120, height: 80,
      entities: () => [
        BlockLibrary._rect(0, 0, 120, 80),
        BlockLibrary._rect(10, 10, 110, 70)
      ]
    },
    'table-coffee': {
      category: 'furniture', name: 'Bàn trà 100×60', icon: '☕', width: 100, height: 60,
      entities: () => [BlockLibrary._rect(0, 0, 100, 60)]
    },
    'table-desk': {
      category: 'furniture', name: 'Bàn làm việc', icon: '💻', width: 120, height: 60,
      entities: () => [
        BlockLibrary._rect(0, 0, 120, 60),
        BlockLibrary._rect(0, 0, 40, 55),
        BlockLibrary._line(40, 10, 40, 50)
      ]
    },
    'table-round': {
      category: 'furniture', name: 'Bàn tròn Ø100', icon: '⭕', width: 100, height: 100,
      entities: () => [{ type: 'CIRCLE', cx: 50, cy: 50, r: 50 }]
    },
    'chair-dining': {
      category: 'furniture', name: 'Ghế ăn', icon: '🪑', width: 45, height: 45,
      entities: () => [
        BlockLibrary._rect(5, 5, 40, 40),
        BlockLibrary._rect(8, 30, 37, 42)
      ]
    },
    'chair-office': {
      category: 'furniture', name: 'Ghế văn phòng', icon: '🪑', width: 55, height: 55,
      entities: () => [
        BlockLibrary._rect(10, 10, 45, 45),
        BlockLibrary._rect(8, 35, 47, 50),
        BlockLibrary._line(8, 10, 8, 5),
        BlockLibrary._line(47, 10, 47, 5)
      ]
    },
    'sofa-2seat': {
      category: 'furniture', name: 'Sofa 2 chỗ', icon: '🛋️', width: 160, height: 80,
      entities: () => [
        BlockLibrary._rect(0, 0, 160, 80),
        BlockLibrary._rect(8, 8, 152, 55),
        BlockLibrary._line(8, 55, 152, 55)
      ]
    },
    'sofa-3seat': {
      category: 'furniture', name: 'Sofa 3 chỗ', icon: '🛋️', width: 220, height: 90,
      entities: () => [
        BlockLibrary._rect(0, 0, 220, 90),
        BlockLibrary._rect(8, 8, 212, 60),
        BlockLibrary._line(80, 8, 80, 60),
        BlockLibrary._line(140, 8, 140, 60)
      ]
    },
    'sofa-lshape': {
      category: 'furniture', name: 'Sofa góc L', icon: '🛋️', width: 240, height: 200,
      entities: () => [{
        type: 'POLYLINE', closed: true,
        points: [
          { x: 0, y: 0 }, { x: 160, y: 0 }, { x: 160, y: 80 },
          { x: 240, y: 80 }, { x: 240, y: 200 }, { x: 0, y: 200 }
        ]
      }]
    },
    'bed-single': {
      category: 'furniture', name: 'Giường 100×200', icon: '🛏️', width: 100, height: 200,
      entities: () => [
        BlockLibrary._rect(0, 0, 100, 200),
        BlockLibrary._rect(5, 5, 95, 195),
        BlockLibrary._rect(5, 170, 95, 200)
      ]
    },
    'bed-double': {
      category: 'furniture', name: 'Giường 160×200', icon: '🛏️', width: 160, height: 200,
      entities: () => [
        BlockLibrary._rect(0, 0, 160, 200),
        BlockLibrary._rect(5, 5, 155, 195),
        BlockLibrary._rect(5, 170, 155, 200)
      ]
    },
    'bed-king': {
      category: 'furniture', name: 'Giường 180×200', icon: '🛏️', width: 180, height: 200,
      entities: () => [
        BlockLibrary._rect(0, 0, 180, 200),
        BlockLibrary._rect(5, 5, 175, 195),
        BlockLibrary._rect(5, 170, 175, 200)
      ]
    },
    'wardrobe': {
      category: 'furniture', name: 'Tủ quần áo', icon: '🚪', width: 120, height: 60,
      entities: () => [
        BlockLibrary._rect(0, 0, 120, 60),
        BlockLibrary._line(60, 0, 60, 60),
        BlockLibrary._line(30, 15, 30, 45),
        BlockLibrary._line(90, 15, 90, 45)
      ]
    },
    'wardrobe-slide': {
      category: 'furniture', name: 'Tủ lùa 180', icon: '🗄️', width: 180, height: 60,
      entities: () => [
        BlockLibrary._rect(0, 0, 180, 60),
        BlockLibrary._line(90, 0, 90, 60),
        BlockLibrary._line(0, 30, 180, 30)
      ]
    },
    'mirror-round': {
      category: 'furniture', name: 'Gương tròn', icon: '🪞', width: 60, height: 60,
      entities: () => [{ type: 'CIRCLE', cx: 30, cy: 30, r: 30 }]
    },
    'mirror-rect': {
      category: 'furniture', name: 'Gương chữ nhật', icon: '🪞', width: 60, height: 80,
      entities: () => [BlockLibrary._rect(0, 0, 60, 80)]
    },
    'tv-stand': {
      category: 'furniture', name: 'Kệ TV', icon: '📺', width: 150, height: 40,
      entities: () => [
        BlockLibrary._rect(0, 0, 150, 40),
        BlockLibrary._line(0, 20, 150, 20),
        BlockLibrary._rect(60, 20, 90, 40)
      ]
    },
    'bookshelf': {
      category: 'furniture', name: 'Kệ sách', icon: '📚', width: 80, height: 30,
      entities: () => [
        BlockLibrary._rect(0, 0, 80, 30),
        BlockLibrary._line(0, 10, 80, 10),
        BlockLibrary._line(0, 20, 80, 20),
        BlockLibrary._line(27, 0, 27, 30),
        BlockLibrary._line(53, 0, 53, 30)
      ]
    },
    'cabinet-kitchen-base': {
      category: 'kitchen', name: 'Tủ bếp dưới', icon: '🍳', width: 60, height: 60,
      entities: () => [
        BlockLibrary._rect(0, 0, 60, 60),
        BlockLibrary._line(0, 45, 60, 45),
        BlockLibrary._line(30, 45, 30, 60)
      ]
    },
    'cabinet-kitchen-wall': {
      category: 'kitchen', name: 'Tủ bếp trên', icon: '🍳', width: 60, height: 35,
      entities: () => [
        BlockLibrary._rect(0, 0, 60, 35),
        BlockLibrary._line(30, 0, 30, 35)
      ]
    },
    'kitchen-island': {
      category: 'kitchen', name: 'Đảo bếp', icon: '🏝️', width: 120, height: 80,
      entities: () => [
        BlockLibrary._rect(0, 0, 120, 80),
        BlockLibrary._rect(10, 10, 110, 70),
        BlockLibrary._rect(45, 10, 75, 40)
      ]
    },
    'kitchen-sink': {
      category: 'kitchen', name: 'Bồn rửa bếp', icon: '🚰', width: 80, height: 50,
      entities: () => [
        BlockLibrary._rect(0, 0, 80, 50),
        BlockLibrary._rect(10, 10, 70, 40),
        { type: 'CIRCLE', cx: 25, cy: 25, r: 10 },
        { type: 'CIRCLE', cx: 55, cy: 25, r: 10 }
      ]
    },
    'kitchen-stove': {
      category: 'kitchen', name: 'Bếp nấu', icon: '🔥', width: 60, height: 60,
      entities: () => [
        BlockLibrary._rect(0, 0, 60, 60),
        { type: 'CIRCLE', cx: 20, cy: 30, r: 12 },
        { type: 'CIRCLE', cx: 40, cy: 30, r: 12 }
      ]
    },
    'kitchen-fridge': {
      category: 'kitchen', name: 'Tủ lạnh', icon: '❄️', width: 70, height: 70,
      entities: () => [
        BlockLibrary._rect(0, 0, 70, 70),
        BlockLibrary._line(0, 45, 70, 45),
        BlockLibrary._line(55, 5, 65, 5),
        BlockLibrary._line(55, 50, 65, 50)
      ]
    },
    'stairs': {
      category: 'stair', name: 'Cầu thang thẳng', icon: '🪜', width: 100, height: 200,
      entities: () => BlockLibrary._stairsStraight(100, 200, 10)
    },
    'stairs-l': {
      category: 'stair', name: 'Cầu thang chữ L', icon: '↩️', width: 200, height: 200,
      entities: () => BlockLibrary._stairsL(100, 200)
    },
    'stairs-u': {
      category: 'stair', name: 'Cầu thang chữ U', icon: '⮕', width: 280, height: 200,
      entities: () => BlockLibrary._stairsU(100, 200, 280)
    },
    'stairs-winder': {
      category: 'stair', name: 'Cầu thang quạt', icon: '🌀', width: 200, height: 200,
      entities: () => BlockLibrary._stairsWinder(100, 200)
    },
    'stairs-spiral': {
      category: 'stair', name: 'Cầu thang xoắn ốc', icon: '🔄', width: 160, height: 160,
      entities: () => BlockLibrary._stairsSpiral(80, 12)
    },
    'stairs-double': {
      category: 'stair', name: 'Cầu thang đôi', icon: '⏫', width: 220, height: 200,
      entities: () => BlockLibrary._stairsDouble(200)
    },
    'stairs-external': {
      category: 'stair', name: 'Cầu thang ngoài', icon: '🏡', width: 120, height: 240,
      entities: () => BlockLibrary._stairsExternal(120, 240)
    },
    'stairs-platform': {
      category: 'stair', name: 'Cầu thang + bục', icon: '⬆️', width: 100, height: 260,
      entities: () => BlockLibrary._stairsWithLanding(100, 260)
    },
    'toilet': {
      category: 'bath', name: 'Bồn cầu', icon: '🚽', width: 40, height: 60,
      entities: () => [
        BlockLibrary._rect(0, 0, 40, 60),
        { type: 'CIRCLE', cx: 20, cy: 40, r: 12 }
      ]
    },
    'bathtub': {
      category: 'bath', name: 'Bồn tắm', icon: '🛁', width: 170, height: 75,
      entities: () => [
        BlockLibrary._rect(0, 0, 170, 75),
        BlockLibrary._rect(10, 10, 160, 65)
      ]
    },
    'sink-bath': {
      category: 'bath', name: 'Lavabo', icon: '🚰', width: 60, height: 45,
      entities: () => [
        BlockLibrary._rect(0, 0, 60, 45),
        { type: 'CIRCLE', cx: 30, cy: 22, r: 15 }
      ]
    },
    'shower': {
      category: 'bath', name: 'Vách tắm 90×90', icon: '🚿', width: 90, height: 90,
      entities: () => [
        BlockLibrary._rect(0, 0, 90, 90),
        BlockLibrary._line(0, 0, 90, 90),
        { type: 'CIRCLE', cx: 75, cy: 15, r: 8 }
      ]
    },
    'washing-machine': {
      category: 'bath', name: 'Máy giặt', icon: '🧺', width: 60, height: 60,
      entities: () => [
        BlockLibrary._rect(0, 0, 60, 60),
        { type: 'CIRCLE', cx: 30, cy: 35, r: 18 },
        BlockLibrary._rect(5, 5, 55, 15)
      ]
    },
    'outlet': {
      category: 'mep', name: 'Ổ cắm điện', icon: '🔌', width: 8, height: 8,
      entities: () => [
        { type: 'CIRCLE', cx: 4, cy: 4, r: 4 },
        BlockLibrary._line(2, 4, 6, 4),
        BlockLibrary._line(4, 2, 4, 6)
      ]
    },
    'switch': {
      category: 'mep', name: 'Công tắc', icon: '💡', width: 8, height: 8,
      entities: () => [
        BlockLibrary._rect(0, 0, 8, 8),
        BlockLibrary._line(2, 4, 6, 4)
      ]
    },
    'pipe': {
      category: 'mep', name: 'Ống nước', icon: '🔧', width: 50, height: 6,
      entities: () => [
        { type: 'CIRCLE', cx: 3, cy: 3, r: 3 },
        BlockLibrary._line(3, 3, 47, 3),
        { type: 'CIRCLE', cx: 47, cy: 3, r: 3 }
      ]
    },
    'tree-deciduous': {
      category: 'landscape', name: 'Cây lá rộng Ø100', icon: '🌳', width: 100, height: 100,
      entities: () => [
        { type: 'CIRCLE', cx: 50, cy: 50, r: 50 },
        { type: 'CIRCLE', cx: 50, cy: 50, r: 8 }
      ]
    },
    'tree-palm': {
      category: 'landscape', name: 'Cây cọ', icon: '🌴', width: 80, height: 80,
      entities: () => [
        { type: 'CIRCLE', cx: 40, cy: 40, r: 18 },
        BlockLibrary._line(40, 40, 10, 10),
        BlockLibrary._line(40, 40, 70, 10),
        BlockLibrary._line(40, 40, 70, 70),
        BlockLibrary._line(40, 40, 10, 70),
        BlockLibrary._line(40, 40, 40, 5)
      ]
    },
    'bush-round': {
      category: 'landscape', name: 'Bụi cây Ø50', icon: '🌿', width: 50, height: 50,
      entities: () => [{ type: 'CIRCLE', cx: 25, cy: 25, r: 25 }]
    },
    'pool-rect': {
      category: 'landscape', name: 'Hồ bơi 400×800', icon: '🏊', width: 400, height: 800,
      entities: () => [
        {
          type: 'HATCH',
          boundary: [{ x: 0, y: 0 }, { x: 400, y: 0 }, { x: 400, y: 800 }, { x: 0, y: 800 }],
          pattern: 'SOLID'
        },
        BlockLibrary._rect(0, 0, 400, 800)
      ]
    },
    'pool-round': {
      category: 'landscape', name: 'Hồ tròn Ø400', icon: '🏊', width: 400, height: 400,
      entities: () => [{ type: 'CIRCLE', cx: 200, cy: 200, r: 200 }]
    },
    'path-stone': {
      category: 'landscape', name: 'Lối đi đá 120', icon: '🛤️', width: 120, height: 60,
      entities: () => [BlockLibrary._rect(0, 0, 120, 60)]
    },
    'lawn-patch': {
      category: 'landscape', name: 'Thảm cỏ 200×200', icon: '🟩', width: 200, height: 200,
      entities: () => [BlockLibrary._rect(0, 0, 200, 200)]
    },
    'flower-bed': {
      category: 'landscape', name: 'Luống hoa 200×80', icon: '🌸', width: 200, height: 80,
      entities: () => [
        BlockLibrary._rect(0, 0, 200, 80),
        { type: 'CIRCLE', cx: 40, cy: 40, r: 12 },
        { type: 'CIRCLE', cx: 100, cy: 40, r: 12 },
        { type: 'CIRCLE', cx: 160, cy: 40, r: 12 }
      ]
    },
    'bench-park': {
      category: 'landscape', name: 'Ghế công viên', icon: '🪑', width: 120, height: 45,
      entities: () => [
        BlockLibrary._rect(0, 0, 120, 45),
        BlockLibrary._rect(5, 5, 115, 25)
      ]
    },
    'pergola': {
      category: 'landscape', name: 'Pergola 300×300', icon: '⛺', width: 300, height: 300,
      entities: () => [
        BlockLibrary._rect(0, 0, 300, 300),
        BlockLibrary._rect(20, 20, 280, 280),
        BlockLibrary._line(20, 20, 280, 280),
        BlockLibrary._line(280, 20, 20, 280)
      ]
    },
    'fountain-round': {
      category: 'landscape', name: 'Đài phun Ø120', icon: '⛲', width: 120, height: 120,
      entities: () => [
        { type: 'CIRCLE', cx: 60, cy: 60, r: 60 },
        { type: 'CIRCLE', cx: 60, cy: 60, r: 20 },
        BlockLibrary._line(60, 10, 60, 40),
        BlockLibrary._line(60, 80, 60, 110),
        BlockLibrary._line(10, 60, 40, 60),
        BlockLibrary._line(80, 60, 110, 60)
      ]
    },
    'fence-segment': {
      category: 'landscape', name: 'Hàng rào 180', icon: '🚧', width: 180, height: 8,
      entities: () => [
        BlockLibrary._line(0, 0, 180, 0),
        BlockLibrary._line(0, 8, 180, 8),
        BlockLibrary._line(30, 0, 30, 8),
        BlockLibrary._line(60, 0, 60, 8),
        BlockLibrary._line(90, 0, 90, 8),
        BlockLibrary._line(120, 0, 120, 8),
        BlockLibrary._line(150, 0, 150, 8)
      ]
    },
    'outdoor-table': {
      category: 'landscape', name: 'Bàn ngoài trời', icon: '☂️', width: 120, height: 120,
      entities: () => [
        { type: 'CIRCLE', cx: 60, cy: 60, r: 40 },
        BlockLibrary._rect(10, 10, 25, 25),
        BlockLibrary._rect(95, 10, 110, 25),
        BlockLibrary._rect(10, 95, 25, 110),
        BlockLibrary._rect(95, 95, 110, 110)
      ]
    },
    'gazebo': {
      category: 'landscape', name: 'Gazebo 350×350', icon: '🛖', width: 350, height: 350,
      entities: () => [
        { type: 'CIRCLE', cx: 175, cy: 175, r: 175 },
        BlockLibrary._rect(155, 155, 195, 195)
      ]
    },
    'curtain-panel': {
      category: 'decor', name: 'Rèm cửa', icon: '🪟', width: 180, height: 8,
      entities: () => [
        BlockLibrary._rect(0, 0, 180, 8),
        BlockLibrary._line(0, 0, 180, 0),
        BlockLibrary._line(45, 0, 45, 8),
        BlockLibrary._line(90, 0, 90, 8),
        BlockLibrary._line(135, 0, 135, 8)
      ]
    },
    'carpet-area': {
      category: 'decor', name: 'Thảm trải sàn', icon: '🟫', width: 200, height: 140,
      entities: () => [
        BlockLibrary._rect(0, 0, 200, 140),
        BlockLibrary._rect(15, 15, 185, 125)
      ]
    },
    'floor-lamp': {
      category: 'decor', name: 'Đèn sàn', icon: '💡', width: 35, height: 35,
      entities: () => [
        { type: 'CIRCLE', cx: 17, cy: 17, r: 12 },
        BlockLibrary._line(17, 17, 17, 32),
        BlockLibrary._line(10, 32, 24, 32)
      ]
    },
    'pendant-lamp': {
      category: 'decor', name: 'Đèn thả', icon: '🔆', width: 40, height: 40,
      entities: () => [
        BlockLibrary._line(20, 0, 20, 15),
        { type: 'CIRCLE', cx: 20, cy: 28, r: 12 }
      ]
    },
    'painting-frame': {
      category: 'decor', name: 'Tranh treo tường', icon: '🖼️', width: 80, height: 60,
      entities: () => [
        BlockLibrary._rect(0, 0, 80, 60),
        BlockLibrary._rect(8, 8, 72, 52)
      ]
    },
    'planter-round': {
      category: 'decor', name: 'Chậu cây tròn', icon: '🪴', width: 50, height: 50,
      entities: () => [
        { type: 'CIRCLE', cx: 25, cy: 30, r: 18 },
        { type: 'CIRCLE', cx: 25, cy: 18, r: 14 }
      ]
    }
  };

  static _rect(x1, y1, x2, y2) {
    return { type: 'RECTANGLE', x1, y1, x2, y2 };
  }

  static _line(x1, y1, x2, y2) {
    return { type: 'LINE', x1, y1, x2, y2 };
  }

  static _stairsStraight(w, len, steps) {
    const lines = [];
    const step = len / steps;
    for (let i = 0; i <= steps; i++) {
      const y = i * step;
      lines.push(BlockLibrary._line(0, y, w, y));
    }
    lines.push(BlockLibrary._line(0, 0, 0, len));
    lines.push(BlockLibrary._line(w, 0, w, len));
    lines.push(BlockLibrary._line(w * 0.4, len * 0.5, w * 0.4, len * 0.35));
    lines.push(BlockLibrary._line(w * 0.35, len * 0.4, w * 0.45, len * 0.4));
    return lines;
  }

  static _stairsL(w, total) {
    const lines = BlockLibrary._stairsStraight(w, total * 0.55, 6);
    const y0 = total * 0.45;
    lines.push(BlockLibrary._line(0, y0, w, y0));
    lines.push(BlockLibrary._line(w, y0, w, total));
    for (let i = 0; i <= 5; i++) {
      const x = w + i * (total * 0.45 / 5);
      lines.push(BlockLibrary._line(x, y0, x, total));
    }
    lines.push(BlockLibrary._line(w, total, w + total * 0.45, total));
    return lines;
  }

  static _stairsU(runW, runLen, totalW) {
    const lines = [];
    const gap = totalW - runW * 2;
    lines.push(...BlockLibrary._stairsStraight(runW, runLen * 0.42, 5));
    const yMid = runLen * 0.42;
    lines.push(BlockLibrary._line(0, yMid, totalW, yMid));
    lines.push(BlockLibrary._line(0, runLen * 0.58, totalW, runLen * 0.58));
    for (let i = 0; i <= 5; i++) {
      const y = yMid + i * ((runLen * 0.42) / 5);
      lines.push(BlockLibrary._line(totalW - runW, y, totalW, y));
    }
    lines.push(BlockLibrary._line(totalW - runW, yMid, totalW - runW, runLen));
    lines.push(BlockLibrary._line(totalW, yMid, totalW, runLen));
    for (let i = 0; i <= 5; i++) {
      const y = runLen - i * ((runLen * 0.42) / 5);
      lines.push(BlockLibrary._line(0, y, runW, y));
    }
    lines.push(BlockLibrary._line(gap, 0, gap, yMid));
    lines.push(BlockLibrary._line(gap + runW, 0, gap + runW, yMid));
    return lines;
  }

  static _stairsWinder(w, total) {
    const lines = BlockLibrary._stairsL(w, total);
    const cx = w;
    const cy = total * 0.45;
    for (let i = 0; i < 5; i++) {
      const a1 = (Math.PI / 2) * (i / 5);
      const a2 = (Math.PI / 2) * ((i + 1) / 5);
      lines.push(BlockLibrary._line(
        cx + Math.cos(a1) * w * 0.45, cy + Math.sin(a1) * w * 0.45,
        cx + Math.cos(a2) * w * 0.45, cy + Math.sin(a2) * w * 0.45
      ));
    }
    return lines;
  }

  static _stairsSpiral(r, steps) {
    const lines = [];
    lines.push({ type: 'CIRCLE', cx: r, cy: r, r });
    lines.push({ type: 'CIRCLE', cx: r, cy: r, r: r * 0.25 });
    for (let i = 0; i < steps; i++) {
      const a1 = (i / steps) * Math.PI * 2;
      const a2 = ((i + 0.85) / steps) * Math.PI * 2;
      lines.push(BlockLibrary._line(
        r + Math.cos(a1) * r * 0.3, r + Math.sin(a1) * r * 0.3,
        r + Math.cos(a2) * r, r + Math.sin(a2) * r
      ));
    }
    lines.push(BlockLibrary._line(r, r, r, r - r * 0.2));
    return lines;
  }

  static _stairsDouble(len) {
    const w = 100;
    const lines = BlockLibrary._stairsStraight(w, len * 0.45, 5);
    lines.push(...BlockLibrary._stairsStraight(w, len * 0.45, 5).map(def => ({
      ...def,
      x1: def.x1 + 120, x2: def.x2 + 120
    })));
    lines.push(BlockLibrary._line(0, len * 0.45, 220, len * 0.45));
    lines.push(BlockLibrary._line(0, len * 0.55, 220, len * 0.55));
    lines.push(BlockLibrary._line(110, 0, 110, len * 0.45));
    return lines;
  }

  static _stairsExternal(w, len) {
    const lines = BlockLibrary._stairsStraight(w, len * 0.7, 8);
    lines.push(BlockLibrary._rect(0, len * 0.7, w, len));
    lines.push(BlockLibrary._line(0, len * 0.7, w, len));
    lines.push(BlockLibrary._line(w, len * 0.7, 0, len));
    return lines;
  }

  static _stairsWithLanding(w, len) {
    const lines = BlockLibrary._stairsStraight(w, len * 0.35, 4);
    lines.push(BlockLibrary._rect(0, len * 0.35, w, len * 0.5));
    lines.push(...BlockLibrary._stairsStraight(w, len * 0.35, 4).map(def => ({
      ...def,
      y1: def.y1 + len * 0.5,
      y2: def.y2 + len * 0.5
    })));
    lines.push(BlockLibrary._line(0, len * 0.5, w, len * 0.5));
    lines.push(BlockLibrary._line(0, len, w, len));
    return lines;
  }

  static list(category) {
    return Object.entries(this.templates)
      .filter(([, t]) => !category || category === 'all' || t.category === category)
      .map(([id, t]) => ({ id, ...t }));
  }

  static findByKeyword(text) {
    const s = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const rules = [
      { re: /cua\s*doi|cua\s*2\s*canh/, id: 'door-double' },
      { re: /cua\s*lua|cua\s*trượt|cua\s*truot/, id: 'door-sliding' },
      { re: /cua\s*am|cua\s*pocket/, id: 'door-pocket' },
      { re: /cua\s*so\s*lua|cua\s*so\s*truot/, id: 'window-sliding' },
      { re: /cua\s*so\s*vat|cua\s*so\s*bay/, id: 'window-bay' },
      { re: /cua\s*so|cua\s*kinh/, id: 'window' },
      { re: /cua\s*don|cua\s*di|cua\s*900/, id: 'door-single' },
      { re: /sofa\s*goc|sofa\s*l/, id: 'sofa-lshape' },
      { re: /sofa\s*3|sofa\s*ba/, id: 'sofa-3seat' },
      { re: /sofa/, id: 'sofa-2seat' },
      { re: /giuong\s*180|giuong\s*king/, id: 'bed-king' },
      { re: /giuong\s*160|giuong\s*doi/, id: 'bed-double' },
      { re: /giuong/, id: 'bed-single' },
      { re: /ban\s*an|ban\s*120/, id: 'table-dining' },
      { re: /ban\s*tra|ban\s*cafe/, id: 'table-coffee' },
      { re: /ban\s*lam|ban\s*hoc|ban\s*van\s*phong/, id: 'table-desk' },
      { re: /ban\s*tron/, id: 'table-round' },
      { re: /ghe\s*van|ghe\s*vp/, id: 'chair-office' },
      { re: /ghe/, id: 'chair-dining' },
      { re: /tu\s*lua|tu\s*trượt/, id: 'wardrobe-slide' },
      { re: /tu\s*ao|tu\s*quần|tu\s*quan/, id: 'wardrobe' },
      { re: /guong\s*tron/, id: 'mirror-round' },
      { re: /guong/, id: 'mirror-rect' },
      { re: /ke\s*tv|tivi/, id: 'tv-stand' },
      { re: /ke\s*sach|tu\s*sach/, id: 'bookshelf' },
      { re: /dao\s*bep|dao\s*nau/, id: 'kitchen-island' },
      { re: /tu\s*bep\s*tren|tu\s*treo/, id: 'cabinet-kitchen-wall' },
      { re: /tu\s*bep|tu\s*duoi/, id: 'cabinet-kitchen-base' },
      { re: /bon\s*rua\s*bep|bon\s*bep/, id: 'kitchen-sink' },
      { re: /bep\s*nau|bep\s*ga/, id: 'kitchen-stove' },
      { re: /tu\s*lanh/, id: 'kitchen-fridge' },
      { re: /bon\s*tam|bồn\s*tắm/, id: 'bathtub' },
      { re: /lavabo|bon\s*rua/, id: 'sink-bath' },
      { re: /vach\s*tam|tam\s*đung|vach\s*tam/, id: 'shower' },
      { re: /may\s*giat|giặt/, id: 'washing-machine' },
      { re: /bon\s*cau|wc|toilet/, id: 'toilet' },
      { re: /cau\s*thang\s*xoan|cau\s*thang\s*ốc|spiral/, id: 'stairs-spiral' },
      { re: /cau\s*thang\s*quat|winder/, id: 'stairs-winder' },
      { re: /cau\s*thang\s*chữ\s*u|cau\s*thang\s*u|chieu\s*u/, id: 'stairs-u' },
      { re: /cau\s*thang\s*chữ\s*l|cau\s*thang\s*l|chieu\s*l/, id: 'stairs-l' },
      { re: /cau\s*thang\s*doi|cau\s*thang\s*2\s*nhanh/, id: 'stairs-double' },
      { re: /cau\s*thang\s*ngoai|thang\s*ngoai/, id: 'stairs-external' },
      { re: /cau\s*thang\s*buc|thang.*buc|platform/, id: 'stairs-platform' },
      { re: /cau\s*thang\s*thang|thang\s*thang/, id: 'stairs' },
      { re: /cau\s*thang|stairs/, id: 'stairs' },
      { re: /o\s*cam|dien|outlet/, id: 'outlet' },
      { re: /cong\s*tac|switch/, id: 'switch' },
      { re: /ong\s*nuoc|pipe/, id: 'pipe' },
      { re: /cay\s*(la\s*rong|tron)|tree/, id: 'tree-deciduous' },
      { re: /cay\s*co|palm/, id: 'tree-palm' },
      { re: /bui\s*cay|bush/, id: 'bush-round' },
      { re: /ho\s*boi|pool/, id: 'pool-rect' },
      { re: /loi\s*di|path|duong\s*di/, id: 'path-stone' },
      { re: /tham\s*co|lawn|co/, id: 'lawn-patch' },
      { re: /vuon\s*hoa|flower|luong\s*hoa/, id: 'flower-bed' },
      { re: /ghe\s*cong\s*vien|bench/, id: 'bench-park' },
      { re: /pergola|mai\s*che/, id: 'pergola' },
      { re: /dai\s*phun|fountain/, id: 'fountain-round' },
      { re: /hang\s*rao|fence/, id: 'fence-segment' },
      { re: /ban\s*ngoai\s*troi|outdoor/, id: 'outdoor-table' },
      { re: /gazebo|chòi/, id: 'gazebo' },
      { re: /rem\s*cua|rem/, id: 'curtain-panel' },
      { re: /tham|carpet/, id: 'carpet-area' },
      { re: /den\s*san|den\s*floor/, id: 'floor-lamp' },
      { re: /den\s*tha|pendant/, id: 'pendant-lamp' },
      { re: /tranh|khung/, id: 'painting-frame' },
      { re: /chau\s*cay|planter/, id: 'planter-round' }
    ];
    for (const { re, id } of rules) {
      if (re.test(s)) return id;
    }
    return null;
  }

  static insert(app, templateId, insertPoint = { x: 0, y: 0 }, options = {}) {
    if (typeof InteriorPlacementEngine !== 'undefined') {
      return InteriorPlacementEngine.insert(app, templateId, insertPoint, options);
    }
    const tpl = this.templates[templateId];
    if (!tpl) return { success: false, message: 'Template not found' };

    const defs = typeof tpl.entities === 'function' ? tpl.entities(tpl.width, tpl.height) : tpl.entities;
    const layerId = app.layerManager.currentLayerId;
    const entities = [];

    for (const def of defs) {
      const e = BlockLibrary._createEntity(def, layerId);
      if (e) {
        ArchPlanStyle.styleBlockEntity(e, templateId);
        e.move(insertPoint.x, insertPoint.y);
        app.drawing.addEntity(e);
        entities.push(e);
      }
    }

    if (entities.length && app.cadCore?.history) {
      if (entities.length === 1) {
        app.cadCore.history.push({ type: 'ADD_ENTITY', entity: entities[0] });
      } else {
        app.cadCore.history.push({ type: 'ADD_ENTITIES', entities });
      }
    }

    app.requestRender();
    app.updateStatusBar();
    return { success: true, entities, name: tpl.name, id: templateId };
  }

  static _createEntity(def, layerId) {
    switch (def.type) {
      case 'LINE': return new LineEntity(layerId, def.x1, def.y1, def.x2, def.y2);
      case 'CIRCLE': return new CircleEntity(layerId, def.cx, def.cy, def.r);
      case 'ARC': return new ArcEntity(layerId, def.cx, def.cy, def.r, def.startAngle, def.endAngle);
      case 'RECTANGLE': return new RectangleEntity(layerId, def.x1, def.y1, def.x2, def.y2);
      case 'TEXT': return new TextEntity(layerId, def.x, def.y, def.text, def.height || 3);
      case 'HATCH': {
        const h = new HatchEntity(layerId, def.boundary || [], def.pattern || 'SOLID', def.scale, def.angle);
        return h;
      }
      case 'POLYLINE': {
        const pl = new PolylineEntity(layerId, def.points || []);
        pl.closed = def.closed || false;
        return pl;
      }
      default: return null;
    }
  }
}

class InsertTemplateTool extends Tool {
  constructor(app) {
    super(app);
    this.name = 'insert-template';
    this.templateId = null;
    this.rotation = 0;
  }

  setTemplate(id, commercialId) {
    this.templateId = id;
    this.commercialId = commercialId || null;
    this.rotation = 0;
  }

  activate() {
    super.activate();
    if (!this.commercialId) this.commercialId = null;
    this.rotation = 0;
    this.app.updateToolInfo(this.getPrompt());
  }

  getPrompt() {
    const name = BlockLibrary.templates[this.templateId]?.name || 'mẫu';
    let deg = Math.round((this.rotation * 180) / Math.PI) % 360;
    if (deg < 0) deg += 360;
    return `CHÈN: Click đặt "${name}". R = +90°. [ / ] = -/+5° (giữ Shift: 1°). Góc: ${deg}°. Esc = hủy.`;
  }

  onMouseMove(e, worldPos) {
    if (!this.templateId) return;
    const tpl = BlockLibrary.templates[this.templateId];
    if (!tpl) return;
    const snap = this._getSnappedPos(worldPos);
    const scale = typeof InteriorPlacementEngine !== 'undefined'
      ? InteriorPlacementEngine.worldScale(this.app) : 1;
    const w = (tpl.width || 60) * scale;
    const h = (tpl.height || 60) * scale;
    const layerId = this.app.layerManager.currentLayerId;
    const preview = new RectangleEntity(layerId, snap.x, snap.y, snap.x + w, snap.y + h);
    preview.style.lineDash = [6, 4];
    preview.style.color = '#4fc3f7';
    if (this.rotation) preview.rotate(snap.x, snap.y, this.rotation);
    this.app.renderer2D.setPreview(preview);
    this.app.requestRender();
  }

  onMouseDown(e, worldPos) {
    if (!this.templateId) {
      this.app.setTool('select');
      return;
    }
    const snap = this._getSnappedPos(worldPos);
    const styleId = this.app.drawing.metadata?.interiorStyle;
    let r;
    if (this.commercialId && typeof InteriorCommercialAssets !== 'undefined') {
      r = InteriorCommercialAssets.insert(this.app, this.commercialId, { x: snap.x, y: snap.y }, {
        rotation: this.rotation,
        styleId
      });
    } else {
      r = BlockLibrary.insert(this.app, this.templateId, { x: snap.x, y: snap.y }, {
        rotation: this.rotation,
        styleId
      });
    }
    if (r.success) this.app.logCommand(r.message || `Đã chèn: ${r.name || this.templateId}`);
    this.commercialId = null;
    this.app.setTool('select');
  }

  onKeyDown(e) {
    if (e.key === 'Escape') this.app.setTool('select');

    if (e.key === 'r' || e.key === 'R') {
      this.rotation += Math.PI / 2;
    } else if (e.key === '[' || e.key === '{') {
      const step = e.shiftKey ? (Math.PI / 180) : (5 * Math.PI / 180);
      this.rotation -= step;
    } else if (e.key === ']' || e.key === '}') {
      const step = e.shiftKey ? (Math.PI / 180) : (5 * Math.PI / 180);
      this.rotation += step;
    } else {
      return;
    }

    const full = Math.PI * 2;
    this.rotation = ((this.rotation % full) + full) % full;

    this.app.updateToolInfo(this.getPrompt());
    this.app.requestRender();
  }
}
