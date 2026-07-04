/**
 * InteriorSupplierLibrary — nhà cung cấp vật liệu & nội thất (SDD §15, Phase 4)
 */
class InteriorSupplierLibrary {
  static suppliers = {
    'san-go-viet': {
      id: 'san-go-viet', name: 'Sàn Gỗ Việt', category: 'floor',
      phone: '028 3822 8899', email: 'sales@sango.vn', location: 'TP.HCM',
      leadDays: 7, rating: 4.6, warrantyPolicy: 'Bảo hành 5 năm sàn gỗ'
    },
    'gach-ceramic-vn': {
      id: 'gach-ceramic-vn', name: 'Ceramic Tile VN', category: 'floor',
      phone: '024 3789 5566', email: 'order@ceramicvn.com', location: 'Hà Nội',
      leadDays: 5, rating: 4.4, warrantyPolicy: 'Đổi trả lỗi sản xuất 12 tháng'
    },
    'son-dulux': {
      id: 'son-dulux', name: 'AkzoNobel Dulux VN', category: 'wall',
      phone: '1800 588 866', email: 'dulux@akzonobel.com', location: 'Toàn quốc',
      leadDays: 3, rating: 4.7, warrantyPolicy: 'Bảo hành màu 5 năm'
    },
    'son-jotun': {
      id: 'son-jotun', name: 'Jotun Việt Nam', category: 'wall',
      phone: '028 3744 6222', email: 'vn@jotun.com', location: 'TP.HCM',
      leadDays: 4, rating: 4.5, warrantyPolicy: 'Bảo hành 3–7 năm theo dòng'
    },
    'noi-that-a': {
      id: 'noi-that-a', name: 'Nội Thất A', category: 'furniture',
      phone: '0909 123 456', email: 'contact@noithata.vn', location: 'TP.HCM',
      leadDays: 14, rating: 4.3, warrantyPolicy: 'Bảo hành 2 năm khung & vải'
    },
    'noi-that-japandi': {
      id: 'noi-that-japandi', name: 'Japandi Home', category: 'furniture',
      phone: '0908 765 432', email: 'hello@japandihome.vn', location: 'Hà Nội',
      leadDays: 21, rating: 4.8, warrantyPolicy: 'Bảo hành 3 năm gỗ tự nhiên'
    },
    'philips-lighting': {
      id: 'philips-lighting', name: 'Philips Lighting VN', category: 'lighting',
      phone: '1800 6888', email: 'lighting@philips.vn', location: 'Toàn quốc',
      leadDays: 5, rating: 4.6, warrantyPolicy: 'Bảo hành đèn LED 2 năm'
    },
    'rang-dong': {
      id: 'rang-dong', name: 'Rạng Đông', category: 'lighting',
      phone: '024 3858 4848', email: 'sales@rangdong.com.vn', location: 'Hà Nội',
      leadDays: 3, rating: 4.5, warrantyPolicy: 'Bảo hành 24 tháng'
    },
    'rem-decor': {
      id: 'rem-decor', name: 'Rèm Decor Việt', category: 'textile',
      phone: '0912 345 678', email: 'info@remdecor.vn', location: 'TP.HCM',
      leadDays: 10, rating: 4.2, warrantyPolicy: 'Bảo hành may 12 tháng'
    },
    'plant-green': {
      id: 'plant-green', name: 'Green Space VN', category: 'plant',
      phone: '0938 111 222', email: 'care@greenspace.vn', location: 'TP.HCM',
      leadDays: 2, rating: 4.4, warrantyPolicy: 'Cam kết cây sống 30 ngày'
    },
    'tho-thi-cong': {
      id: 'tho-thi-cong', name: 'Thợ Thi Công Nội Thất', category: 'labor',
      phone: '0903 999 888', email: 'thicong@webcad.vn', location: 'Toàn quốc',
      leadDays: 1, rating: 4.5, warrantyPolicy: 'Bảo hành thi công 12 tháng'
    }
  };

  static categoryDefaults = {
    floor: ['san-go-viet', 'gach-ceramic-vn'],
    wall: ['son-dulux', 'son-jotun'],
    ceiling: ['son-dulux'],
    wood: ['san-go-viet', 'noi-that-japandi'],
    tile: ['gach-ceramic-vn'],
    paint: ['son-dulux', 'son-jotun'],
    fabric: ['rem-decor'],
    furniture: ['noi-that-a', 'noi-that-japandi'],
    bed: ['noi-that-a'],
    sofa: ['noi-that-a'],
    kitchen: ['noi-that-a'],
    bath: ['noi-that-a'],
    lighting: ['philips-lighting', 'rang-dong'],
    textile: ['rem-decor'],
    plant: ['plant-green'],
    decor: ['noi-that-a'],
    labor: ['tho-thi-cong']
  };

  static list(category) {
    return Object.values(this.suppliers).filter(s => !category || s.category === category);
  }

  static get(id) {
    return this.suppliers[id] ? { ...this.suppliers[id] } : null;
  }

  static match(material, asset) {
    const keys = [];
    if (material?.kind) keys.push(material.kind);
    if (material?.category) keys.push(material.category);
    if (asset?.category) keys.push(asset.category);

    for (const key of keys) {
      const ids = InteriorSupplierLibrary.categoryDefaults[key];
      if (ids?.length) return InteriorSupplierLibrary.get(ids[0]);
    }
    return InteriorSupplierLibrary.get('noi-that-a');
  }
}
