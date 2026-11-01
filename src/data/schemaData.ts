export interface PrismaField {
  name: string;
  type: string;
  isId?: boolean;
  isUnique?: boolean;
  isOptional?: boolean;
  isList?: boolean;
  isRelation?: boolean;
  relationFromFields?: string[];
  relationToFields?: string[];
  onDelete?: 'Cascade' | 'Restrict' | 'SetNull' | 'NoAction';
  defaultValue?: string;
  isCreatedAt?: boolean;
  isUpdatedAt?: boolean;
  description?: string;
}

export interface PrismaModel {
  name: string;
  tableName?: string;
  domain: string;
  domainColor: string;
  description: string;
  fields: PrismaField[];
  indexes?: string[];
  compositeUnique?: string[];
  compositeId?: string[];
  x: number;
  y: number;
}

export interface PrismaEnum {
  name: string;
  description: string;
  values: string[];
}

export interface RelationEdge {
  id: string;
  sourceModel: string;
  sourceField: string;
  targetModel: string;
  targetField: string;
  cardinality: '1:1' | '1:N' | 'N:M';
  onDelete?: string;
  isOptional: boolean;
  label?: string;
}

export const DOMAINS = [
  { id: 'all', label: 'All Models', count: 22, color: 'text-slate-200' },
  { id: 'Auth & Identity', label: 'Auth & Identity', count: 3, color: 'text-emerald-400' },
  { id: 'Profiles & HR', label: 'Profiles & HR', count: 5, color: 'text-purple-400' },
  { id: 'Catalog & Services', label: 'Catalog & Services', count: 4, color: 'text-pink-400' },
  { id: 'Operations & Booking', label: 'Booking & Operations', count: 5, color: 'text-amber-400' },
  { id: 'Inventory & Supplies', label: 'Inventory & Supplies', count: 2, color: 'text-cyan-400' },
  { id: 'Loyalty & Points', label: 'Loyalty & Points', count: 1, color: 'text-yellow-400' },
  { id: 'Facilities & Settings', label: 'Facilities & Settings', count: 2, color: 'text-indigo-400' },
] as const;

export const INITIAL_ENUMS: PrismaEnum[] = [
  {
    name: 'RoleName',
    description: 'System access permission tiers',
    values: ['ADMIN', 'STYLIST', 'HELPER', 'CUSTOMER']
  },
  {
    name: 'CategoryName',
    description: 'Core salon service departments',
    values: ['NAILS', 'HAIRS']
  },
  {
    name: 'FacilityKind',
    description: 'Physical equipment and seating assets',
    values: ['NAIL_CHAIR', 'HAIR_CHAIR', 'SOFA', 'MIRROR', 'TABLE', 'OTHER']
  },
  {
    name: 'FacilityCondition',
    description: 'Asset maintenance and operational health',
    values: ['NEW', 'GOOD', 'FAIR', 'NEEDS_REPAIR', 'RETIRED']
  },
  {
    name: 'BookingStatus',
    description: 'Client appointment lifecycle state',
    values: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']
  },
  {
    name: 'NotificationType',
    description: 'Alert dispatch triggers and categories',
    values: ['BOOKING_CREATED', 'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'REMINDER', 'BOOKING_COMPLETED', 'NO_SHOW', 'SUPPLY_LOW_STOCK']
  },
  {
    name: 'SupplyUnit',
    description: 'Inventory packaging and measurement units',
    values: ['PIECE', 'BOTTLE', 'BOX', 'PACK', 'ML', 'GRAM', 'SET']
  },
  {
    name: 'StockMoveType',
    description: 'Warehouse inventory entry and deduction reasons',
    values: ['PURCHASE', 'ADJUSTMENT', 'WASTE']
  },
  {
    name: 'EmploymentStatus',
    description: 'Employee contract status',
    values: ['ACTIVE', 'ON_LEAVE', 'RESIGNED', 'TERMINATED']
  },
  {
    name: 'SalaryType',
    description: 'Payroll calculation method',
    values: ['MONTHLY', 'DAILY', 'HOURLY', 'COMMISSION']
  },
  {
    name: 'CommissionStatus',
    description: 'Stylist commission settlement lifecycle',
    values: ['PENDING', 'PAID', 'CANCELLED']
  },
  {
    name: 'PointMoveType',
    description: 'Customer loyalty ledger entry reason',
    values: ['EARN', 'REDEEM', 'ADJUST', 'EXPIRE']
  },
  {
    name: 'HistoryKind',
    description: 'Audit log event classification',
    values: ['BOOKING', 'PROMO', 'POINTS', 'SYSTEM']
  }
];

export const INITIAL_MODELS: PrismaModel[] = [
  // 1. Role
  {
    name: 'Role',
    domain: 'Auth & Identity',
    domainColor: '#10b981',
    description: 'Defines authorization levels and role constraints for all platform users.',
    x: 60,
    y: 80,
    fields: [
      { name: 'id', type: 'String', isId: true, defaultValue: 'cuid()' },
      { name: 'value', type: 'Int', isUnique: true },
      { name: 'name', type: 'RoleName', isUnique: true },
      { name: 'users', type: 'User[]', isList: true, isRelation: true },
      { name: 'createdAt', type: 'DateTime', defaultValue: 'now()', isCreatedAt: true },
      { name: 'updatedAt', type: 'DateTime', isUpdatedAt: true },
    ]
  },
  // 2. User
  {
    name: 'User',
    domain: 'Auth & Identity',
    domainColor: '#10b981',
    description: 'Central identity record for staff, stylists, admins, and registered customers.',
    x: 440,
    y: 80,
    fields: [
      { name: 'id', type: 'String', isId: true, defaultValue: 'cuid()' },
      { name: 'name', type: 'String' },
      { name: 'username', type: 'String', isUnique: true },
      { name: 'email', type: 'String', isUnique: true },
      { name: 'phone', type: 'String', isOptional: true },
      { name: 'password', type: 'String' },
      { name: 'roleId', type: 'String', isRelation: true, relationFromFields: ['roleId'], relationToFields: ['id'], onDelete: 'Restrict' },
      { name: 'role', type: 'Role', isRelation: true },
      { name: 'stylistProfile', type: 'StylistProfile', isOptional: true, isRelation: true },
      { name: 'customerProfile', type: 'CustomerProfile', isOptional: true, isRelation: true },
      { name: 'staffBookings', type: 'Booking[]', isList: true, isRelation: true },
      { name: 'staffProfile', type: 'StaffProfile', isOptional: true, isRelation: true },
      { name: 'history', type: 'History[]', isList: true, isRelation: true },
      { name: 'refreshTokens', type: 'RefreshToken[]', isList: true, isRelation: true },
      { name: 'createdAt', type: 'DateTime', defaultValue: 'now()', isCreatedAt: true },
      { name: 'updatedAt', type: 'DateTime', isUpdatedAt: true },
    ]
  },
  // 3. RefreshToken
  {
    name: 'RefreshToken',
    domain: 'Auth & Identity',
    domainColor: '#10b981',
    description: 'JWT session rotation tokens for secure mobile and web client authentication.',
    x: 60,
    y: 450,
    indexes: ['[userId, expiresAt]'],
    fields: [
      { name: 'id', type: 'String', isId: true, defaultValue: 'cuid()' },
      { name: 'userId', type: 'String', isRelation: true, relationFromFields: ['userId'], relationToFields: ['id'], onDelete: 'Cascade' },
      { name: 'user', type: 'User', isRelation: true },
      { name: 'tokenHash', type: 'String', isUnique: true },
      { name: 'expiresAt', type: 'DateTime' },
      { name: 'revokedAt', type: 'DateTime', isOptional: true },
      { name: 'replacedById', type: 'String', isOptional: true, isUnique: true },
      { name: 'createdAt', type: 'DateTime', defaultValue: 'now()', isCreatedAt: true },
    ]
  },
  // 4. CustomerProfile
  {
    name: 'CustomerProfile',
    domain: 'Profiles & HR',
    domainColor: '#a855f7',
    description: 'Salon client preference metadata, allergies, booking ledger, and loyalty points.',
    x: 880,
    y: 80,
    fields: [
      { name: 'id', type: 'String', isId: true, defaultValue: 'cuid()' },
      { name: 'userId', type: 'String', isUnique: true, isRelation: true, relationFromFields: ['userId'], relationToFields: ['id'], onDelete: 'Cascade' },
      { name: 'user', type: 'User', isRelation: true },
      { name: 'birthday', type: 'DateTime', isOptional: true },
      { name: 'avatar', type: 'String', isOptional: true },
      { name: 'allergies', type: 'String', isOptional: true },
      { name: 'preferences', type: 'String', isOptional: true },
      { name: 'bookings', type: 'Booking[]', isList: true, isRelation: true },
      { name: 'pointMoves', type: 'PointLedger[]', isList: true, isRelation: true },
      { name: 'reviews', type: 'Review[]', isList: true, isRelation: true },
      { name: 'createdAt', type: 'DateTime', defaultValue: 'now()', isCreatedAt: true },
      { name: 'updatedAt', type: 'DateTime', isUpdatedAt: true },
    ]
  },
  // 5. StylistProfile
  {
    name: 'StylistProfile',
    domain: 'Profiles & HR',
    domainColor: '#a855f7',
    description: 'Stylist rating summary, portfolio image, specialties, and commission earnings.',
    x: 880,
    y: 560,
    fields: [
      { name: 'id', type: 'String', isId: true, defaultValue: 'cuid()' },
      { name: 'userId', type: 'String', isUnique: true, isRelation: true, relationFromFields: ['userId'], relationToFields: ['id'], onDelete: 'Cascade' },
      { name: 'user', type: 'User', isRelation: true },
      { name: 'name', type: 'String' },
      { name: 'image', type: 'String', isOptional: true },
      { name: 'rating', type: 'Float', defaultValue: '0' },
      { name: 'ratingCount', type: 'Int', defaultValue: '0' },
      { name: 'specialties', type: 'StylistSpecialty[]', isList: true, isRelation: true },
      { name: 'commissionEarnings', type: 'CommissionEarning[]', isList: true, isRelation: true },
      { name: 'reviews', type: 'Review[]', isList: true, isRelation: true },
      { name: 'createdAt', type: 'DateTime', defaultValue: 'now()', isCreatedAt: true },
      { name: 'updatedAt', type: 'DateTime', isUpdatedAt: true },
    ]
  },
  // 6. StaffProfile
  {
    name: 'StaffProfile',
    domain: 'Profiles & HR',
    domainColor: '#a855f7',
    description: 'Employment records, payroll terms, contracts, and emergency contacts.',
    x: 440,
    y: 720,
    fields: [
      { name: 'id', type: 'String', isId: true, defaultValue: 'cuid()' },
      { name: 'userId', type: 'String', isUnique: true, isRelation: true, relationFromFields: ['userId'], relationToFields: ['id'], onDelete: 'Cascade' },
      { name: 'user', type: 'User', isRelation: true },
      { name: 'employeeCode', type: 'String', isOptional: true, isUnique: true },
      { name: 'hireDate', type: 'DateTime', isOptional: true },
      { name: 'status', type: 'EmploymentStatus', defaultValue: 'ACTIVE' },
      { name: 'salaryType', type: 'SalaryType', isOptional: true },
      { name: 'salaryAmount', type: 'Int', isOptional: true },
      { name: 'address', type: 'String', isOptional: true },
      { name: 'emergencyName', type: 'String', isOptional: true },
      { name: 'emergencyPhone', type: 'String', isOptional: true },
      { name: 'nationalId', type: 'String', isOptional: true },
      { name: 'note', type: 'String', isOptional: true },
      { name: 'createdAt', type: 'DateTime', defaultValue: 'now()', isCreatedAt: true },
      { name: 'updatedAt', type: 'DateTime', isUpdatedAt: true },
    ]
  },
  // 7. Category
  {
    name: 'Category',
    domain: 'Catalog & Services',
    domainColor: '#ec4899',
    description: 'Top-level department classification (e.g. Nails, Hair, Skin).',
    x: 1320,
    y: 80,
    fields: [
      { name: 'id', type: 'String', isId: true, defaultValue: 'cuid()' },
      { name: 'name', type: 'CategoryName', isUnique: true },
      { name: 'image', type: 'String', isOptional: true },
      { name: 'services', type: 'Service[]', isList: true, isRelation: true },
      { name: 'specialists', type: 'StylistSpecialty[]', isList: true, isRelation: true },
      { name: 'supplies', type: 'Supply[]', isList: true, isRelation: true },
      { name: 'createdAt', type: 'DateTime', defaultValue: 'now()', isCreatedAt: true },
      { name: 'updatedAt', type: 'DateTime', isUpdatedAt: true },
    ]
  },
  // 8. Service
  {
    name: 'Service',
    domain: 'Catalog & Services',
    domainColor: '#ec4899',
    description: 'Individual bookable salon treatments, base pricing, and duration.',
    x: 1720,
    y: 80,
    compositeUnique: ['[categoryId, name]'],
    fields: [
      { name: 'id', type: 'String', isId: true, defaultValue: 'cuid()' },
      { name: 'categoryId', type: 'String', isRelation: true, relationFromFields: ['categoryId'], relationToFields: ['id'], onDelete: 'Restrict' },
      { name: 'category', type: 'Category', isRelation: true },
      { name: 'name', type: 'String' },
      { name: 'description', type: 'String', isOptional: true },
      { name: 'image', type: 'String', isOptional: true },
      { name: 'basePrice', type: 'Int' },
      { name: 'durationMin', type: 'Int', isOptional: true },
      { name: 'isActive', type: 'Boolean', defaultValue: 'true' },
      { name: 'commissionRate', type: 'Float', isOptional: true },
      { name: 'addOns', type: 'ServiceAddOn[]', isList: true, isRelation: true },
      { name: 'bookings', type: 'Booking[]', isList: true, isRelation: true },
      { name: 'createdAt', type: 'DateTime', defaultValue: 'now()', isCreatedAt: true },
      { name: 'updatedAt', type: 'DateTime', isUpdatedAt: true },
    ]
  },
  // 9. AddOn
  {
    name: 'AddOn',
    domain: 'Catalog & Services',
    domainColor: '#ec4899',
    description: 'Optional upsell treatments (e.g. Gel Polish, Scalp Massage, Cuticle Oil).',
    x: 2140,
    y: 80,
    fields: [
      { name: 'id', type: 'String', isId: true, defaultValue: 'cuid()' },
      { name: 'name', type: 'String', isUnique: true },
      { name: 'image', type: 'String', isOptional: true },
      { name: 'price', type: 'Int' },
      { name: 'durationMin', type: 'Int', isOptional: true },
      { name: 'isActive', type: 'Boolean', defaultValue: 'true' },
      { name: 'services', type: 'ServiceAddOn[]', isList: true, isRelation: true },
      { name: 'bookings', type: 'BookingAddOn[]', isList: true, isRelation: true },
      { name: 'createdAt', type: 'DateTime', defaultValue: 'now()', isCreatedAt: true },
      { name: 'updatedAt', type: 'DateTime', isUpdatedAt: true },
    ]
  },
  // 10. ServiceAddOn
  {
    name: 'ServiceAddOn',
    domain: 'Catalog & Services',
    domainColor: '#ec4899',
    description: 'Many-to-many join junction linking Services to compatible Add-ons.',
    x: 1940,
    y: 520,
    compositeId: ['[serviceId, addOnId]'],
    fields: [
      { name: 'serviceId', type: 'String', isRelation: true, relationFromFields: ['serviceId'], relationToFields: ['id'], onDelete: 'Cascade' },
      { name: 'service', type: 'Service', isRelation: true },
      { name: 'addOnId', type: 'String', isRelation: true, relationFromFields: ['addOnId'], relationToFields: ['id'], onDelete: 'Restrict' },
      { name: 'addOn', type: 'AddOn', isRelation: true },
    ]
  },
  // 11. StylistSpecialty
  {
    name: 'StylistSpecialty',
    domain: 'Profiles & HR',
    domainColor: '#a855f7',
    description: 'Junction table binding Stylists to qualified service categories.',
    x: 1320,
    y: 540,
    compositeId: ['[stylistId, categoryId]'],
    fields: [
      { name: 'stylistId', type: 'String', isRelation: true, relationFromFields: ['stylistId'], relationToFields: ['id'], onDelete: 'Cascade' },
      { name: 'stylist', type: 'StylistProfile', isRelation: true },
      { name: 'categoryId', type: 'String', isRelation: true, relationFromFields: ['categoryId'], relationToFields: ['id'], onDelete: 'Restrict' },
      { name: 'category', type: 'Category', isRelation: true },
    ]
  },
  // 12. Booking
  {
    name: 'Booking',
    domain: 'Operations & Booking',
    domainColor: '#f59e0b',
    description: 'Core salon appointment entity linking customers, stylists, services, and pricing.',
    x: 1100,
    y: 1040,
    indexes: ['[status, startAt]', '[staffId, startAt]', '[customerProfileId, startAt]'],
    fields: [
      { name: 'id', type: 'String', isId: true, defaultValue: 'cuid()' },
      { name: 'customerProfileId', type: 'String', isOptional: true, isRelation: true, relationFromFields: ['customerProfileId'], relationToFields: ['id'], onDelete: 'Restrict' },
      { name: 'customerProfile', type: 'CustomerProfile', isOptional: true, isRelation: true },
      { name: 'guestName', type: 'String', isOptional: true },
      { name: 'guestPhone', type: 'String', isOptional: true },
      { name: 'serviceId', type: 'String', isRelation: true, relationFromFields: ['serviceId'], relationToFields: ['id'], onDelete: 'Restrict' },
      { name: 'service', type: 'Service', isRelation: true },
      { name: 'staffId', type: 'String', isOptional: true, isRelation: true, relationFromFields: ['staffId'], relationToFields: ['id'], onDelete: 'Restrict' },
      { name: 'staff', type: 'User', isOptional: true, isRelation: true },
      { name: 'startAt', type: 'DateTime' },
      { name: 'endAt', type: 'DateTime' },
      { name: 'basePrice', type: 'Int' },
      { name: 'totalPrice', type: 'Int' },
      { name: 'status', type: 'BookingStatus', defaultValue: 'PENDING' },
      { name: 'notes', type: 'String', isOptional: true },
      { name: 'addOns', type: 'BookingAddOn[]', isList: true, isRelation: true },
      { name: 'commissionEarning', type: 'CommissionEarning', isOptional: true, isRelation: true },
      { name: 'pointMoves', type: 'PointLedger[]', isList: true, isRelation: true },
      { name: 'history', type: 'History[]', isList: true, isRelation: true },
      { name: 'review', type: 'Review', isOptional: true, isRelation: true },
      { name: 'createdAt', type: 'DateTime', defaultValue: 'now()', isCreatedAt: true },
      { name: 'updatedAt', type: 'DateTime', isUpdatedAt: true },
    ]
  },
  // 13. BookingAddOn
  {
    name: 'BookingAddOn',
    domain: 'Operations & Booking',
    domainColor: '#f59e0b',
    description: 'Custom add-ons included in an appointment snapshot with agreed price.',
    x: 1680,
    y: 1040,
    compositeId: ['[bookingId, addOnId]'],
    fields: [
      { name: 'bookingId', type: 'String', isRelation: true, relationFromFields: ['bookingId'], relationToFields: ['id'], onDelete: 'Cascade' },
      { name: 'booking', type: 'Booking', isRelation: true },
      { name: 'addOnId', type: 'String', isRelation: true, relationFromFields: ['addOnId'], relationToFields: ['id'], onDelete: 'Restrict' },
      { name: 'addOn', type: 'AddOn', isRelation: true },
      { name: 'price', type: 'Int' },
    ]
  },
  // 14. CommissionEarning
  {
    name: 'CommissionEarning',
    domain: 'Profiles & HR',
    domainColor: '#a855f7',
    description: 'Commission payouts allocated to individual stylists per completed booking.',
    x: 620,
    y: 1120,
    fields: [
      { name: 'id', type: 'String', isId: true, defaultValue: 'cuid()' },
      { name: 'bookingId', type: 'String', isUnique: true, isRelation: true, relationFromFields: ['bookingId'], relationToFields: ['id'], onDelete: 'Restrict' },
      { name: 'booking', type: 'Booking', isRelation: true },
      { name: 'stylistId', type: 'String', isRelation: true, relationFromFields: ['stylistId'], relationToFields: ['id'], onDelete: 'Restrict' },
      { name: 'stylist', type: 'StylistProfile', isRelation: true },
      { name: 'rate', type: 'Float' },
      { name: 'amount', type: 'Int' },
      { name: 'status', type: 'CommissionStatus', defaultValue: 'PENDING' },
      { name: 'paidAt', type: 'DateTime', isOptional: true },
      { name: 'createdAt', type: 'DateTime', defaultValue: 'now()', isCreatedAt: true },
      { name: 'updatedAt', type: 'DateTime', isUpdatedAt: true },
    ]
  },
  // 15. Review
  {
    name: 'Review',
    domain: 'Operations & Booking',
    domainColor: '#f59e0b',
    description: 'Customer ratings and comments left after a completed appointment.',
    x: 1100,
    y: 1660,
    indexes: ['[stylistProfileId, createdAt]', '[customerProfileId, createdAt]'],
    fields: [
      { name: 'id', type: 'String', isId: true, defaultValue: 'cuid()' },
      { name: 'bookingId', type: 'String', isUnique: true, isRelation: true, relationFromFields: ['bookingId'], relationToFields: ['id'], onDelete: 'Restrict' },
      { name: 'booking', type: 'Booking', isRelation: true },
      { name: 'customerProfileId', type: 'String', isRelation: true, relationFromFields: ['customerProfileId'], relationToFields: ['id'], onDelete: 'Cascade' },
      { name: 'customerProfile', type: 'CustomerProfile', isRelation: true },
      { name: 'stylistProfileId', type: 'String', isOptional: true, isRelation: true, relationFromFields: ['stylistProfileId'], relationToFields: ['id'], onDelete: 'SetNull' },
      { name: 'stylistProfile', type: 'StylistProfile', isOptional: true, isRelation: true },
      { name: 'rating', type: 'Int' },
      { name: 'comment', type: 'String', isOptional: true },
      { name: 'isVisible', type: 'Boolean', defaultValue: 'true' },
      { name: 'createdAt', type: 'DateTime', defaultValue: 'now()', isCreatedAt: true },
      { name: 'updatedAt', type: 'DateTime', isUpdatedAt: true },
    ]
  },
  // 16. History
  {
    name: 'History',
    domain: 'Operations & Booking',
    domainColor: '#f59e0b',
    description: 'Chronological timeline logs for user actions, status shifts, and notifications.',
    x: 60,
    y: 840,
    indexes: ['[userId, createdAt]'],
    fields: [
      { name: 'id', type: 'String', isId: true, defaultValue: 'cuid()' },
      { name: 'userId', type: 'String', isRelation: true, relationFromFields: ['userId'], relationToFields: ['id'], onDelete: 'Cascade' },
      { name: 'user', type: 'User', isRelation: true },
      { name: 'kind', type: 'HistoryKind' },
      { name: 'bookingId', type: 'String', isOptional: true, isRelation: true, relationFromFields: ['bookingId'], relationToFields: ['id'], onDelete: 'Cascade' },
      { name: 'booking', type: 'Booking', isOptional: true, isRelation: true },
      { name: 'title', type: 'String' },
      { name: 'body', type: 'String' },
      { name: 'refName', type: 'String', isOptional: true },
      { name: 'notification', type: 'Notification', isOptional: true, isRelation: true },
      { name: 'createdAt', type: 'DateTime', defaultValue: 'now()', isCreatedAt: true },
    ]
  },
  // 17. Notification
  {
    name: 'Notification',
    domain: 'Operations & Booking',
    domainColor: '#f59e0b',
    description: 'In-app notification messages delivered to user inbox based on system history.',
    x: 60,
    y: 1260,
    fields: [
      { name: 'id', type: 'String', isId: true, defaultValue: 'cuid()' },
      { name: 'historyId', type: 'String', isUnique: true, isRelation: true, relationFromFields: ['historyId'], relationToFields: ['id'], onDelete: 'Cascade' },
      { name: 'history', type: 'History', isRelation: true },
      { name: 'type', type: 'NotificationType' },
      { name: 'title', type: 'String' },
      { name: 'body', type: 'String' },
      { name: 'isRead', type: 'Boolean', defaultValue: 'false' },
      { name: 'readAt', type: 'DateTime', isOptional: true },
      { name: 'createdAt', type: 'DateTime', defaultValue: 'now()', isCreatedAt: true },
      { name: 'updatedAt', type: 'DateTime', isUpdatedAt: true },
    ]
  },
  // 18. Supply
  {
    name: 'Supply',
    domain: 'Inventory & Supplies',
    domainColor: '#06b6d4',
    description: 'Consumable salon products, hair dyes, gels, foils, and stock levels.',
    x: 1680,
    y: 1420,
    fields: [
      { name: 'id', type: 'String', isId: true, defaultValue: 'cuid()' },
      { name: 'name', type: 'String', isUnique: true },
      { name: 'categoryId', type: 'String', isOptional: true, isRelation: true, relationFromFields: ['categoryId'], relationToFields: ['id'], onDelete: 'Restrict' },
      { name: 'category', type: 'Category', isOptional: true, isRelation: true },
      { name: 'unit', type: 'SupplyUnit' },
      { name: 'quantity', type: 'Float' },
      { name: 'minStock', type: 'Float', defaultValue: '0' },
      { name: 'costPrice', type: 'Int', isOptional: true },
      { name: 'image', type: 'String', isOptional: true },
      { name: 'isActive', type: 'Boolean', defaultValue: 'true' },
      { name: 'moves', type: 'StockMove[]', isList: true, isRelation: true },
      { name: 'createdAt', type: 'DateTime', defaultValue: 'now()', isCreatedAt: true },
      { name: 'updatedAt', type: 'DateTime', isUpdatedAt: true },
    ]
  },
  // 19. StockMove
  {
    name: 'StockMove',
    domain: 'Inventory & Supplies',
    domainColor: '#06b6d4',
    description: 'Stock transactions tracking purchases, adjustments, and salon usage waste.',
    x: 2100,
    y: 1420,
    indexes: ['[supplyId, createdAt]'],
    fields: [
      { name: 'id', type: 'String', isId: true, defaultValue: 'cuid()' },
      { name: 'supplyId', type: 'String', isRelation: true, relationFromFields: ['supplyId'], relationToFields: ['id'], onDelete: 'Cascade' },
      { name: 'supply', type: 'Supply', isRelation: true },
      { name: 'type', type: 'StockMoveType' },
      { name: 'quantity', type: 'Float' },
      { name: 'note', type: 'String', isOptional: true },
      { name: 'createdAt', type: 'DateTime', defaultValue: 'now()', isCreatedAt: true },
    ]
  },
  // 20. PointLedger
  {
    name: 'PointLedger',
    domain: 'Loyalty & Points',
    domainColor: '#eab308',
    description: 'Reward point ledger tracking earn, redemption, expiry, and adjustments.',
    x: 620,
    y: 1540,
    indexes: ['[customerProfileId, createdAt]'],
    fields: [
      { name: 'id', type: 'String', isId: true, defaultValue: 'cuid()' },
      { name: 'customerProfileId', type: 'String', isRelation: true, relationFromFields: ['customerProfileId'], relationToFields: ['id'], onDelete: 'Restrict' },
      { name: 'customerProfile', type: 'CustomerProfile', isRelation: true },
      { name: 'bookingId', type: 'String', isOptional: true, isRelation: true, relationFromFields: ['bookingId'], relationToFields: ['id'], onDelete: 'Cascade' },
      { name: 'booking', type: 'Booking', isOptional: true, isRelation: true },
      { name: 'type', type: 'PointMoveType' },
      { name: 'points', type: 'Int' },
      { name: 'note', type: 'String', isOptional: true },
      { name: 'expiresAt', type: 'DateTime', isOptional: true },
      { name: 'createdAt', type: 'DateTime', defaultValue: 'now()', isCreatedAt: true },
    ]
  },
  // 21. Facility
  {
    name: 'Facility',
    domain: 'Facilities & Settings',
    domainColor: '#6366f1',
    description: 'Physical equipment assets, styling chairs, manicure stations, and condition.',
    x: 60,
    y: 1680,
    compositeUnique: ['[kind, label]'],
    fields: [
      { name: 'id', type: 'String', isId: true, defaultValue: 'cuid()' },
      { name: 'kind', type: 'FacilityKind' },
      { name: 'label', type: 'String' },
      { name: 'condition', type: 'FacilityCondition', defaultValue: 'GOOD' },
      { name: 'isActive', type: 'Boolean', defaultValue: 'true' },
      { name: 'purchaseDate', type: 'DateTime', isOptional: true },
      { name: 'image', type: 'String', isOptional: true },
      { name: 'quantity', type: 'Int', defaultValue: '1' },
      { name: 'note', type: 'String', isOptional: true },
      { name: 'createdAt', type: 'DateTime', defaultValue: 'now()', isCreatedAt: true },
      { name: 'updatedAt', type: 'DateTime', isUpdatedAt: true },
    ]
  },
  // 22. Setting
  {
    name: 'Setting',
    tableName: 'settings',
    domain: 'Facilities & Settings',
    domainColor: '#6366f1',
    description: 'Salon global configuration, chair capacities, commission rates, and point rules.',
    x: 60,
    y: 2060,
    fields: [
      { name: 'id', type: 'String', isId: true, defaultValue: 'cuid()' },
      { name: 'name', type: 'String' },
      { name: 'logo', type: 'String', isOptional: true },
      { name: 'address', type: 'String', isOptional: true },
      { name: 'phone', type: 'String', isOptional: true },
      { name: 'nailCapacity', type: 'Int', defaultValue: '3' },
      { name: 'hairCapacity', type: 'Int', defaultValue: '3' },
      { name: 'defaultCommissionRate', type: 'Float', isOptional: true },
      { name: 'earnKyatPerPoint', type: 'Int', isOptional: true },
      { name: 'pointExpiryDays', type: 'Int', isOptional: true },
      { name: 'createdAt', type: 'DateTime', defaultValue: 'now()', isCreatedAt: true },
      { name: 'updatedAt', type: 'DateTime', isUpdatedAt: true },
    ]
  }
];

export const INITIAL_EDGES: RelationEdge[] = [
  // User -> Role (User.roleId -> Role.id)
  {
    id: 'user-role',
    sourceModel: 'User',
    sourceField: 'roleId',
    targetModel: 'Role',
    targetField: 'id',
    cardinality: '1:N',
    onDelete: 'Restrict',
    isOptional: false,
    label: 'roleId ➔ Role.id'
  },
  // RefreshToken -> User (RefreshToken.userId -> User.id)
  {
    id: 'refreshtoken-user',
    sourceModel: 'RefreshToken',
    sourceField: 'userId',
    targetModel: 'User',
    targetField: 'id',
    cardinality: '1:N',
    onDelete: 'Cascade',
    isOptional: false,
    label: 'userId ➔ User.id'
  },
  // CustomerProfile -> User (CustomerProfile.userId -> User.id)
  {
    id: 'customerprofile-user',
    sourceModel: 'CustomerProfile',
    sourceField: 'userId',
    targetModel: 'User',
    targetField: 'id',
    cardinality: '1:1',
    onDelete: 'Cascade',
    isOptional: false,
    label: 'userId ➔ User.id (1:1)'
  },
  // StylistProfile -> User (StylistProfile.userId -> User.id)
  {
    id: 'stylistprofile-user',
    sourceModel: 'StylistProfile',
    sourceField: 'userId',
    targetModel: 'User',
    targetField: 'id',
    cardinality: '1:1',
    onDelete: 'Cascade',
    isOptional: false,
    label: 'userId ➔ User.id (1:1)'
  },
  // StaffProfile -> User (StaffProfile.userId -> User.id)
  {
    id: 'staffprofile-user',
    sourceModel: 'StaffProfile',
    sourceField: 'userId',
    targetModel: 'User',
    targetField: 'id',
    cardinality: '1:1',
    onDelete: 'Cascade',
    isOptional: false,
    label: 'userId ➔ User.id (1:1)'
  },
  // Service -> Category (Service.categoryId -> Category.id)
  {
    id: 'service-category',
    sourceModel: 'Service',
    sourceField: 'categoryId',
    targetModel: 'Category',
    targetField: 'id',
    cardinality: '1:N',
    onDelete: 'Restrict',
    isOptional: false,
    label: 'categoryId ➔ Category.id'
  },
  // ServiceAddOn -> Service (ServiceAddOn.serviceId -> Service.id)
  {
    id: 'serviceaddon-service',
    sourceModel: 'ServiceAddOn',
    sourceField: 'serviceId',
    targetModel: 'Service',
    targetField: 'id',
    cardinality: '1:N',
    onDelete: 'Cascade',
    isOptional: false,
    label: 'serviceId ➔ Service.id'
  },
  // ServiceAddOn -> AddOn (ServiceAddOn.addOnId -> AddOn.id)
  {
    id: 'serviceaddon-addon',
    sourceModel: 'ServiceAddOn',
    sourceField: 'addOnId',
    targetModel: 'AddOn',
    targetField: 'id',
    cardinality: '1:N',
    onDelete: 'Restrict',
    isOptional: false,
    label: 'addOnId ➔ AddOn.id'
  },
  // StylistSpecialty -> StylistProfile (StylistSpecialty.stylistId -> StylistProfile.id)
  {
    id: 'stylistspecialty-stylist',
    sourceModel: 'StylistSpecialty',
    sourceField: 'stylistId',
    targetModel: 'StylistProfile',
    targetField: 'id',
    cardinality: '1:N',
    onDelete: 'Cascade',
    isOptional: false,
    label: 'stylistId ➔ Stylist.id'
  },
  // StylistSpecialty -> Category (StylistSpecialty.categoryId -> Category.id)
  {
    id: 'stylistspecialty-category',
    sourceModel: 'StylistSpecialty',
    sourceField: 'categoryId',
    targetModel: 'Category',
    targetField: 'id',
    cardinality: '1:N',
    onDelete: 'Restrict',
    isOptional: false,
    label: 'categoryId ➔ Category.id'
  },
  // Booking -> CustomerProfile (Booking.customerProfileId -> CustomerProfile.id)
  {
    id: 'booking-customerprofile',
    sourceModel: 'Booking',
    sourceField: 'customerProfileId',
    targetModel: 'CustomerProfile',
    targetField: 'id',
    cardinality: '1:N',
    onDelete: 'Restrict',
    isOptional: true,
    label: 'customerProfileId? ➔ CustomerProfile.id'
  },
  // Booking -> Service (Booking.serviceId -> Service.id)
  {
    id: 'booking-service',
    sourceModel: 'Booking',
    sourceField: 'serviceId',
    targetModel: 'Service',
    targetField: 'id',
    cardinality: '1:N',
    onDelete: 'Restrict',
    isOptional: false,
    label: 'serviceId ➔ Service.id'
  },
  // Booking -> User (Booking.staffId -> User.id)
  {
    id: 'booking-user',
    sourceModel: 'Booking',
    sourceField: 'staffId',
    targetModel: 'User',
    targetField: 'id',
    cardinality: '1:N',
    onDelete: 'Restrict',
    isOptional: true,
    label: 'staffId? ➔ User.id'
  },
  // BookingAddOn -> Booking (BookingAddOn.bookingId -> Booking.id)
  {
    id: 'bookingaddon-booking',
    sourceModel: 'BookingAddOn',
    sourceField: 'bookingId',
    targetModel: 'Booking',
    targetField: 'id',
    cardinality: '1:N',
    onDelete: 'Cascade',
    isOptional: false,
    label: 'bookingId ➔ Booking.id'
  },
  // BookingAddOn -> AddOn (BookingAddOn.addOnId -> AddOn.id)
  {
    id: 'bookingaddon-addon',
    sourceModel: 'BookingAddOn',
    sourceField: 'addOnId',
    targetModel: 'AddOn',
    targetField: 'id',
    cardinality: '1:N',
    onDelete: 'Restrict',
    isOptional: false,
    label: 'addOnId ➔ AddOn.id'
  },
  // CommissionEarning -> Booking (CommissionEarning.bookingId -> Booking.id)
  {
    id: 'commissionearning-booking',
    sourceModel: 'CommissionEarning',
    sourceField: 'bookingId',
    targetModel: 'Booking',
    targetField: 'id',
    cardinality: '1:1',
    onDelete: 'Restrict',
    isOptional: false,
    label: 'bookingId ➔ Booking.id (1:1)'
  },
  // CommissionEarning -> StylistProfile (CommissionEarning.stylistId -> StylistProfile.id)
  {
    id: 'commissionearning-stylist',
    sourceModel: 'CommissionEarning',
    sourceField: 'stylistId',
    targetModel: 'StylistProfile',
    targetField: 'id',
    cardinality: '1:N',
    onDelete: 'Restrict',
    isOptional: false,
    label: 'stylistId ➔ StylistProfile.id'
  },
  // PointLedger -> CustomerProfile (PointLedger.customerProfileId -> CustomerProfile.id)
  {
    id: 'pointledger-customerprofile',
    sourceModel: 'PointLedger',
    sourceField: 'customerProfileId',
    targetModel: 'CustomerProfile',
    targetField: 'id',
    cardinality: '1:N',
    onDelete: 'Restrict',
    isOptional: false,
    label: 'customerProfileId ➔ CustomerProfile.id'
  },
  // PointLedger -> Booking (PointLedger.bookingId -> Booking.id)
  {
    id: 'pointledger-booking',
    sourceModel: 'PointLedger',
    sourceField: 'bookingId',
    targetModel: 'Booking',
    targetField: 'id',
    cardinality: '1:N',
    onDelete: 'Cascade',
    isOptional: true,
    label: 'bookingId? ➔ Booking.id'
  },
  // History -> User (History.userId -> User.id)
  {
    id: 'history-user',
    sourceModel: 'History',
    sourceField: 'userId',
    targetModel: 'User',
    targetField: 'id',
    cardinality: '1:N',
    onDelete: 'Cascade',
    isOptional: false,
    label: 'userId ➔ User.id'
  },
  // History -> Booking (History.bookingId -> Booking.id)
  {
    id: 'history-booking',
    sourceModel: 'History',
    sourceField: 'bookingId',
    targetModel: 'Booking',
    targetField: 'id',
    cardinality: '1:N',
    onDelete: 'Cascade',
    isOptional: true,
    label: 'bookingId? ➔ Booking.id'
  },
  // Notification -> History (Notification.historyId -> History.id)
  {
    id: 'notification-history',
    sourceModel: 'Notification',
    sourceField: 'historyId',
    targetModel: 'History',
    targetField: 'id',
    cardinality: '1:1',
    onDelete: 'Cascade',
    isOptional: false,
    label: 'historyId ➔ History.id (1:1)'
  },
  // Supply -> Category (Supply.categoryId -> Category.id)
  {
    id: 'supply-category',
    sourceModel: 'Supply',
    sourceField: 'categoryId',
    targetModel: 'Category',
    targetField: 'id',
    cardinality: '1:N',
    onDelete: 'Restrict',
    isOptional: true,
    label: 'categoryId? ➔ Category.id'
  },
  // StockMove -> Supply (StockMove.supplyId -> Supply.id)
  {
    id: 'stockmove-supply',
    sourceModel: 'StockMove',
    sourceField: 'supplyId',
    targetModel: 'Supply',
    targetField: 'id',
    cardinality: '1:N',
    onDelete: 'Cascade',
    isOptional: false,
    label: 'supplyId ➔ Supply.id'
  },
  // Review -> Booking (Review.bookingId -> Booking.id)
  {
    id: 'review-booking',
    sourceModel: 'Review',
    sourceField: 'bookingId',
    targetModel: 'Booking',
    targetField: 'id',
    cardinality: '1:1',
    onDelete: 'Restrict',
    isOptional: false,
    label: 'bookingId ➔ Booking.id (1:1)'
  },
  // Review -> CustomerProfile (Review.customerProfileId -> CustomerProfile.id)
  {
    id: 'review-customerprofile',
    sourceModel: 'Review',
    sourceField: 'customerProfileId',
    targetModel: 'CustomerProfile',
    targetField: 'id',
    cardinality: '1:N',
    onDelete: 'Cascade',
    isOptional: false,
    label: 'customerProfileId ➔ CustomerProfile.id'
  },
  // Review -> StylistProfile (Review.stylistProfileId -> StylistProfile.id)
  {
    id: 'review-stylistprofile',
    sourceModel: 'Review',
    sourceField: 'stylistProfileId',
    targetModel: 'StylistProfile',
    targetField: 'id',
    cardinality: '1:N',
    onDelete: 'SetNull',
    isOptional: true,
    label: 'stylistProfileId? ➔ StylistProfile.id'
  }
];

export const RAW_PRISMA_SCHEMA = `// Prisma Salon & Spa Management Schema
// 22 Models, 13 Enums, Relational ERD

enum RoleName {
  ADMIN
  STYLIST
  HELPER
  CUSTOMER
}

enum CategoryName {
  NAILS
  HAIRS
}

model Role {
  id        String   @id @default(cuid())
  value     Int      @unique
  name      RoleName @unique
  users     User[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model User {
  id              String           @id @default(cuid())
  name            String
  username        String           @unique
  email           String           @unique
  phone           String?
  password        String
  roleId          String
  role            Role             @relation(fields: [roleId], references: [id], onDelete: Restrict)
  stylistProfile  StylistProfile?
  customerProfile CustomerProfile?
  staffBookings   Booking[]
  staffProfile    StaffProfile?
  history         History[]
  refreshTokens   RefreshToken[]
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
}

model Setting {
  id                    String   @id @default(cuid())
  name                  String
  logo                  String?
  address               String?
  phone                 String?
  nailCapacity          Int      @default(3)
  hairCapacity          Int      @default(3)
  defaultCommissionRate Float?
  earnKyatPerPoint      Int?
  pointExpiryDays       Int?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@map("settings")
}

model CustomerProfile {
  id          String        @id @default(cuid())
  userId      String        @unique
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  birthday    DateTime?
  avatar      String?
  allergies   String?
  preferences String?
  bookings    Booking[]
  pointMoves  PointLedger[]
  reviews     Review[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

model Category {
  id          String             @id @default(cuid())
  name        CategoryName       @unique
  image       String?
  services    Service[]
  specialists StylistSpecialty[]
  supplies    Supply[]
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt
}

model Service {
  id             String         @id @default(cuid())
  categoryId     String
  category       Category       @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  name           String
  description    String?
  image          String?
  basePrice      Int
  durationMin    Int?
  isActive       Boolean        @default(true)
  commissionRate Float?
  addOns         ServiceAddOn[]
  bookings       Booking[]
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  @@unique([categoryId, name])
}

model AddOn {
  id          String         @id @default(cuid())
  name        String         @unique
  image       String?
  price       Int
  durationMin Int?
  isActive    Boolean        @default(true)
  services    ServiceAddOn[]
  bookings    BookingAddOn[]
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
}

model ServiceAddOn {
  serviceId String
  service   Service @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  addOnId   String
  addOn     AddOn   @relation(fields: [addOnId], references: [id], onDelete: Restrict)

  @@id([serviceId, addOnId])
}

enum FacilityKind {
  NAIL_CHAIR
  HAIR_CHAIR
  SOFA
  MIRROR
  TABLE
  OTHER
}

enum FacilityCondition {
  NEW
  GOOD
  FAIR
  NEEDS_REPAIR
  RETIRED
}

model Facility {
  id           String            @id @default(cuid())
  kind         FacilityKind
  label        String
  condition    FacilityCondition @default(GOOD)
  isActive     Boolean           @default(true)
  purchaseDate DateTime?
  image        String?
  quantity     Int               @default(1)
  note         String?
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt

  @@unique([kind, label])
}

model StylistProfile {
  id                 String              @id @default(cuid())
  userId             String              @unique
  user               User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  name               String
  image              String?
  rating             Float               @default(0)
  ratingCount        Int                 @default(0)
  specialties        StylistSpecialty[]
  commissionEarnings CommissionEarning[]
  reviews            Review[]
  createdAt          DateTime            @default(now())
  updatedAt          DateTime            @updatedAt
}

model StylistSpecialty {
  stylistId  String
  stylist    StylistProfile @relation(fields: [stylistId], references: [id], onDelete: Cascade)
  categoryId String
  category   Category       @relation(fields: [categoryId], references: [id], onDelete: Restrict)

  @@id([stylistId, categoryId])
}

enum BookingStatus {
  PENDING
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  NO_SHOW
}

model Booking {
  id                String             @id @default(cuid())
  customerProfileId String?
  customerProfile   CustomerProfile?   @relation(fields: [customerProfileId], references: [id], onDelete: Restrict)
  guestName         String?
  guestPhone        String?
  serviceId         String
  service           Service            @relation(fields: [serviceId], references: [id], onDelete: Restrict)
  staffId           String?
  staff             User?              @relation(fields: [staffId], references: [id], onDelete: Restrict)
  startAt           DateTime
  endAt             DateTime
  basePrice         Int
  totalPrice        Int
  status            BookingStatus      @default(PENDING)
  notes             String?
  addOns            BookingAddOn[]
  commissionEarning CommissionEarning?
  pointMoves        PointLedger[]
  history           History[]
  review            Review?
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt

  @@index([status, startAt])
  @@index([staffId, startAt])
  @@index([customerProfileId, startAt])
}

model BookingAddOn {
  bookingId String
  booking   Booking @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  addOnId   String
  addOn     AddOn   @relation(fields: [addOnId], references: [id], onDelete: Restrict)
  price     Int

  @@id([bookingId, addOnId])
}

enum NotificationType {
  BOOKING_CREATED
  BOOKING_CONFIRMED
  BOOKING_CANCELLED
  REMINDER
  BOOKING_COMPLETED
  NO_SHOW
  SUPPLY_LOW_STOCK
}

model Notification {
  id        String           @id @default(cuid())
  historyId String           @unique
  history   History          @relation(fields: [historyId], references: [id], onDelete: Cascade)
  type      NotificationType
  title     String
  body      String
  isRead    Boolean          @default(false)
  readAt    DateTime?
  createdAt DateTime         @default(now())
  updatedAt DateTime         @updatedAt
}

enum SupplyUnit {
  PIECE
  BOTTLE
  BOX
  PACK
  ML
  GRAM
  SET
}

enum StockMoveType {
  PURCHASE
  ADJUSTMENT
  WASTE
}

model Supply {
  id         String      @id @default(cuid())
  name       String      @unique
  categoryId String?
  category   Category?   @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  unit       SupplyUnit
  quantity   Float
  minStock   Float       @default(0)
  costPrice  Int?
  image      String?
  isActive   Boolean     @default(true)
  moves      StockMove[]
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
}

model StockMove {
  id        String        @id @default(cuid())
  supplyId  String
  supply    Supply        @relation(fields: [supplyId], references: [id], onDelete: Cascade)
  type      StockMoveType
  quantity  Float
  note      String?
  createdAt DateTime      @default(now())

  @@index([supplyId, createdAt])
}

enum EmploymentStatus {
  ACTIVE
  ON_LEAVE
  RESIGNED
  TERMINATED
}

enum SalaryType {
  MONTHLY
  DAILY
  HOURLY
  COMMISSION
}

model StaffProfile {
  id             String           @id @default(cuid())
  userId         String           @unique
  user           User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  employeeCode   String?          @unique
  hireDate       DateTime?
  status         EmploymentStatus @default(ACTIVE)
  salaryType     SalaryType?
  salaryAmount   Int?
  address        String?
  emergencyName  String?
  emergencyPhone String?
  nationalId     String?
  note           String?
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt
}

enum CommissionStatus {
  PENDING
  PAID
  CANCELLED
}

model CommissionEarning {
  id        String           @id @default(cuid())
  bookingId String           @unique
  booking   Booking          @relation(fields: [bookingId], references: [id], onDelete: Restrict)
  stylistId String
  stylist   StylistProfile   @relation(fields: [stylistId], references: [id], onDelete: Restrict)
  rate      Float
  amount    Int
  status    CommissionStatus @default(PENDING)
  paidAt    DateTime?
  createdAt DateTime         @default(now())
  updatedAt DateTime         @updatedAt
}

enum PointMoveType {
  EARN
  REDEEM
  ADJUST
  EXPIRE
}

model PointLedger {
  id                String          @id @default(cuid())
  customerProfileId String
  customerProfile   CustomerProfile @relation(fields: [customerProfileId], references: [id], onDelete: Restrict)
  bookingId         String?
  booking           Booking?        @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  type              PointMoveType
  points            Int
  note              String?
  expiresAt         DateTime?
  createdAt         DateTime        @default(now())

  @@index([customerProfileId, createdAt])
}

enum HistoryKind {
  BOOKING
  PROMO
  POINTS
  SYSTEM
}

model History {
  id           String        @id @default(cuid())
  userId       String
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  kind         HistoryKind
  bookingId    String?
  booking      Booking?      @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  title        String
  body         String
  refName      String?
  notification Notification?
  createdAt    DateTime      @default(now())

  @@index([userId, createdAt])
}

model RefreshToken {
  id           String    @id @default(cuid())
  userId       String
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash    String    @unique
  expiresAt    DateTime
  revokedAt    DateTime?
  replacedById String?   @unique
  createdAt    DateTime  @default(now())

  @@index([userId, expiresAt])
}

model Review {
  id                String          @id @default(cuid())
  bookingId         String          @unique
  booking           Booking         @relation(fields: [bookingId], references: [id], onDelete: Restrict)
  customerProfileId String
  customerProfile   CustomerProfile @relation(fields: [customerProfileId], references: [id], onDelete: Cascade)
  stylistProfileId  String?
  stylistProfile    StylistProfile? @relation(fields: [stylistProfileId], references: [id], onDelete: SetNull)
  rating            Int
  comment           String?
  isVisible         Boolean         @default(true)
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  @@index([stylistProfileId, createdAt])
  @@index([customerProfileId, createdAt])
}
`;
