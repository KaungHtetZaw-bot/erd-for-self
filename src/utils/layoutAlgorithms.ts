import { PrismaModel, RelationEdge } from '../data/schemaData';

export function layoutDomainClusters(models: PrismaModel[]): PrismaModel[] {
  // Domain centers and arrange in neat zones
  const domainCoords: Record<string, { startX: number; startY: number; cols: number }> = {
    'Auth & Identity': { startX: 60, startY: 80, cols: 2 },
    'Profiles & HR': { startX: 680, startY: 80, cols: 2 },
    'Catalog & Services': { startX: 1360, startY: 80, cols: 2 },
    'Operations & Booking': { startX: 680, startY: 720, cols: 2 },
    'Inventory & Supplies': { startX: 1360, startY: 720, cols: 2 },
    'Loyalty & Points': { startX: 60, startY: 720, cols: 1 },
    'Facilities & Settings': { startX: 60, startY: 1120, cols: 1 },
  };

  const domainCounters: Record<string, number> = {};

  return models.map((m) => {
    const config = domainCoords[m.domain] || { startX: 100, startY: 100, cols: 2 };
    const index = domainCounters[m.domain] || 0;
    domainCounters[m.domain] = index + 1;

    const col = index % config.cols;
    const row = Math.floor(index / config.cols);

    return {
      ...m,
      x: config.startX + col * 320,
      y: config.startY + row * 380,
    };
  });
}

export function layoutHierarchical(models: PrismaModel[], edges: RelationEdge[]): PrismaModel[] {
  // Compute in-degree / dependency depth
  const inDegree: Record<string, number> = {};
  models.forEach(m => { inDegree[m.name] = 0; });

  edges.forEach(e => {
    // source has FK pointing to target, so target is a parent / higher layer
    inDegree[e.sourceModel] = (inDegree[e.sourceModel] || 0) + 1;
  });

  // Layer 0: Root entities with 0 or few FKs (Role, Category, Facility, Setting)
  // Layer 1: Core entities (User, Service, AddOn, Supply)
  // Layer 2: Profiles & Junctions (CustomerProfile, StylistProfile, StaffProfile, ServiceAddOn, StylistSpecialty)
  // Layer 3: Transactions (Booking, BookingAddOn, History, RefreshToken)
  // Layer 4: Audit & Logs (Notification, CommissionEarning, PointLedger, Review, StockMove)

  const layers: Record<number, PrismaModel[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] };

  models.forEach(m => {
    const name = m.name;
    if (['Role', 'Category', 'Facility', 'Setting'].includes(name)) {
      layers[0].push(m);
    } else if (['User', 'Service', 'AddOn', 'Supply'].includes(name)) {
      layers[1].push(m);
    } else if (['CustomerProfile', 'StylistProfile', 'StaffProfile', 'ServiceAddOn', 'StylistSpecialty'].includes(name)) {
      layers[2].push(m);
    } else if (['Booking', 'BookingAddOn', 'History', 'RefreshToken'].includes(name)) {
      layers[3].push(m);
    } else {
      layers[4].push(m);
    }
  });

  const cardWidth = 320;
  const colSpacing = 360;
  const rowSpacing = 420;

  const result: PrismaModel[] = [];

  Object.entries(layers).forEach(([layerIndexStr, layerModels]) => {
    const layerIdx = Number(layerIndexStr);
    const totalInLayer = layerModels.length;
    const startX = Math.max(60, (2000 - totalInLayer * colSpacing) / 2);

    layerModels.forEach((m, colIdx) => {
      result.push({
        ...m,
        x: Math.round(startX + colIdx * colSpacing),
        y: Math.round(80 + layerIdx * rowSpacing),
      });
    });
  });

  return result;
}

export function layoutGrid(models: PrismaModel[]): PrismaModel[] {
  const cols = 5;
  const colSpacing = 340;
  const rowSpacing = 400;

  return models.map((m, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    return {
      ...m,
      x: 80 + col * colSpacing,
      y: 80 + row * rowSpacing,
    };
  });
}
