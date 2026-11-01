import { PrismaModel, PrismaField, RelationEdge, PrismaEnum } from '../data/schemaData';

export function detectSchemaType(code: string): 'prisma' | 'sql' {
  const trimmed = code.trim();
  if (/\bmodel\s+[A-Za-z0-9_]+\s*\{/i.test(trimmed) || /\benum\s+[A-Za-z0-9_]+\s*\{/i.test(trimmed)) {
    return 'prisma';
  }
  if (/\bCREATE\s+TABLE\b/i.test(trimmed) || /\bALTER\s+TABLE\b/i.test(trimmed)) {
    return 'sql';
  }
  return 'prisma';
}

// -------------------------------------------------------------
// PRISMA PARSER
// -------------------------------------------------------------
export function parsePrismaSchema(prismaCode: string): {
  models: PrismaModel[];
  edges: RelationEdge[];
  enums: PrismaEnum[];
} {
  const models: PrismaModel[] = [];
  const edges: RelationEdge[] = [];
  const enums: PrismaEnum[] = [];

  // 1. Parse enums
  const enumRegex = /enum\s+([A-Za-z0-9_]+)\s*\{([^}]+)\}/g;
  let enumMatch: RegExpExecArray | null;
  while ((enumMatch = enumRegex.exec(prismaCode)) !== null) {
    const enumName = enumMatch[1];
    const enumBody = enumMatch[2];
    const values = enumBody
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('//') && !line.startsWith('#'))
      .map((line) => line.split(/\s+/)[0]);
    enums.push({
      name: enumName,
      description: `Enum ${enumName}`,
      values,
    });
  }

  // 2. Parse models
  const modelRegex = /model\s+([A-Za-z0-9_]+)\s*\{([^}]+)\}/g;
  let modelMatch: RegExpExecArray | null;
  let index = 0;

  const domainColors = ['#10b981', '#a855f7', '#ec4899', '#f59e0b', '#06b6d4', '#eab308', '#6366f1'];

  while ((modelMatch = modelRegex.exec(prismaCode)) !== null) {
    const modelName = modelMatch[1];
    const modelBody = modelMatch[2];
    const fields: PrismaField[] = [];
    let tableName: string | undefined;
    const compositeIndexes: string[] = [];
    const compositeUnique: string[] = [];
    const compositeId: string[] = [];

    const lines = modelBody.split('\n');

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('//') || line.startsWith('#')) continue;

      if (line.startsWith('@@map(')) {
        const mapMatch = line.match(/@@map\(["']([^"']+)["']\)/);
        if (mapMatch) tableName = mapMatch[1];
        continue;
      }
      if (line.startsWith('@@unique(')) {
        const uMatch = line.match(/@@unique\(([^)]+)\)/);
        if (uMatch) compositeUnique.push(uMatch[1]);
        continue;
      }
      if (line.startsWith('@@id(')) {
        const idMatch = line.match(/@@id\(([^)]+)\)/);
        if (idMatch) compositeId.push(idMatch[1]);
        continue;
      }
      if (line.startsWith('@@index(')) {
        const idxMatch = line.match(/@@index\(([^)]+)\)/);
        if (idxMatch) compositeIndexes.push(idxMatch[1]);
        continue;
      }

      // Field line
      const parts = line.split(/\s+/);
      if (parts.length < 2) continue;

      const fieldName = parts[0];
      const rawType = parts[1];
      const isOptional = rawType.endsWith('?');
      const isList = rawType.endsWith('[]');
      const cleanType = rawType.replace(/[?\[\]]/g, '');

      const isId = line.includes('@id');
      const isUnique = line.includes('@unique');
      const isCreatedAt = line.includes('@default(now())');
      const isUpdatedAt = line.includes('@updatedAt');

      let defaultValue: string | undefined;
      const defMatch = line.match(/@default\(([^)]+)\)/);
      if (defMatch) {
        defaultValue = defMatch[1].replace(/["']/g, '');
      }

      let relationFromFields: string[] | undefined;
      let relationToFields: string[] | undefined;
      let onDelete: 'Cascade' | 'Restrict' | 'SetNull' | 'NoAction' | undefined;

      const relMatch = line.match(/@relation\(([^)]+)\)/);
      let isRelation = false;

      if (relMatch) {
        isRelation = true;
        const relBody = relMatch[1];
        const fieldsMatch = relBody.match(/fields:\s*\[([^\]]+)\]/);
        const refMatch = relBody.match(/references:\s*\[([^\]]+)\]/);
        const delMatch = relBody.match(/onDelete:\s*([A-Za-z]+)/);

        if (fieldsMatch) {
          relationFromFields = fieldsMatch[1].split(',').map((s) => s.trim());
        }
        if (refMatch) {
          relationToFields = refMatch[1].split(',').map((s) => s.trim());
        }
        if (delMatch) {
          onDelete = delMatch[1] as any;
        }
      } else if (isList || !['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json', 'BigInt', 'Decimal', 'Bytes'].includes(cleanType)) {
        // Could be virtual relation (e.g. users User[])
        if (!enums.some((e) => e.name === cleanType)) {
          isRelation = true;
        }
      }

      fields.push({
        name: fieldName,
        type: rawType,
        isId,
        isUnique,
        isOptional,
        isList,
        isRelation,
        relationFromFields,
        relationToFields,
        onDelete,
        defaultValue,
        isCreatedAt,
        isUpdatedAt,
      });

      // If this field defines an explicit relation, record the edge
      if (relationFromFields && relationToFields && relationFromFields.length > 0) {
        const fromCol = relationFromFields[0];
        const toCol = relationToFields[0];
        const cardinality = isUnique ? '1:1' : '1:N';
        edges.push({
          id: `${modelName}-${cleanType}-${fromCol}`,
          sourceModel: modelName,
          sourceField: fromCol,
          targetModel: cleanType,
          targetField: toCol,
          cardinality,
          onDelete,
          isOptional,
          label: `${fromCol} ➔ ${cleanType}.${toCol}`,
        });
      }
    }

    // Assign layout coordinate
    const col = index % 4;
    const row = Math.floor(index / 4);

    models.push({
      name: modelName,
      tableName,
      domain: 'Core Entities',
      domainColor: domainColors[index % domainColors.length],
      description: `Model representing ${modelName} database entity`,
      fields,
      indexes: compositeIndexes,
      compositeUnique,
      compositeId,
      x: 80 + col * 350,
      y: 80 + row * 400,
    });

    index++;
  }

  return { models, edges, enums };
}

// -------------------------------------------------------------
// SQL DDL PARSER
// -------------------------------------------------------------
export function parseSqlDdl(sqlCode: string): {
  models: PrismaModel[];
  edges: RelationEdge[];
  enums: PrismaEnum[];
} {
  const models: PrismaModel[] = [];
  const edges: RelationEdge[] = [];
  const enums: PrismaEnum[] = [];

  const domainColors = ['#10b981', '#38bdf8', '#a855f7', '#ec4899', '#f59e0b', '#06b6d4', '#eab308'];

  // Remove comments
  const cleanSql = sqlCode
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/--.*$/gm, '')
    .replace(/#.*$/gm, '');

  // 1. Extract CREATE TABLE statements
  const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:[`"\[]?([A-Za-z0-9_]+)[`"\]]?\.)?[`"\[]?([A-Za-z0-9_]+)[`"\]]?\s*\(([\s\S]*?)\)(?:;|\s*$)/gi;
  let match: RegExpExecArray | null;
  let modelIndex = 0;

  while ((match = createTableRegex.exec(cleanSql)) !== null) {
    const rawTableName = match[2];
    const body = match[3];

    // Model name in PascalCase
    const modelName = rawTableName
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join('');

    const fields: PrismaField[] = [];
    const tablePKs: string[] = [];

    // Split column definitions by commas outside parentheses
    const rawStatements: string[] = [];
    let parenDepth = 0;
    let current = '';

    for (let i = 0; i < body.length; i++) {
      const char = body[i];
      if (char === '(') parenDepth++;
      else if (char === ')') parenDepth--;

      if (char === ',' && parenDepth === 0) {
        if (current.trim()) rawStatements.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    if (current.trim()) rawStatements.push(current.trim());

    // First pass: detect table-level PRIMARY KEY and FOREIGN KEY constraints
    for (const stmt of rawStatements) {
      const cleanStmt = stmt.trim().replace(/\s+/g, ' ');

      // Table-level PRIMARY KEY (col1, col2)
      const pkMatch = cleanStmt.match(/(?:CONSTRAINT\s+[`"\[]?[A-Za-z0-9_]+[`"\]]?\s+)?PRIMARY\s+KEY\s*\(([^)]+)\)/i);
      if (pkMatch) {
        const pkCols = pkMatch[1]
          .split(',')
          .map((c) => c.replace(/[`"\[\]\s]/g, ''));
        tablePKs.push(...pkCols);
      }

      // Table-level FOREIGN KEY (col) REFERENCES target(target_col)
      const fkMatch = cleanStmt.match(
        /(?:CONSTRAINT\s+[`"\[]?[A-Za-z0-9_]+[`"\]]?\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+[`"\[]?([A-Za-z0-9_]+)[`"\]]?\s*\(([^)]+)\)(?:\s+ON\s+DELETE\s+(CASCADE|RESTRICT|SET\s+NULL|NO\s+ACTION))?/i
      );
      if (fkMatch) {
        const fromCol = fkMatch[1].replace(/[`"\[\]\s]/g, '');
        const targetRaw = fkMatch[2].replace(/[`"\[\]\s]/g, '');
        const toCol = fkMatch[3].replace(/[`"\[\]\s]/g, '');
        const onDeleteRaw = fkMatch[4] ? fkMatch[4].toUpperCase().replace(/\s+/g, '') : undefined;

        const targetModel = targetRaw
          .split('_')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join('');

        edges.push({
          id: `fk-${modelName}-${targetModel}-${fromCol}`,
          sourceModel: modelName,
          sourceField: fromCol,
          targetModel,
          targetField: toCol,
          cardinality: '1:N',
          onDelete: onDeleteRaw as any,
          isOptional: false,
          label: `${fromCol} ➔ ${targetModel}.${toCol}`,
        });
      }
    }

    // Second pass: column definitions
    for (const stmt of rawStatements) {
      const cleanStmt = stmt.trim();

      // Skip table-level constraints
      if (
        /^(?:CONSTRAINT|PRIMARY\s+KEY|FOREIGN\s+KEY|KEY|INDEX|UNIQUE\s+KEY|CHECK)\b/i.test(
          cleanStmt
        )
      ) {
        continue;
      }

      // Column name and type
      const colMatch = cleanStmt.match(/^[`"\[]?([A-Za-z0-9_]+)[`"\]]?\s+([A-Za-z0-9_]+(?:\([^)]+\))?)(.*)$/i);
      if (!colMatch) continue;

      const colName = colMatch[1];
      const rawDataType = colMatch[2];
      const rest = colMatch[3] || '';

      const isInlinePk = /PRIMARY\s+KEY/i.test(rest) || tablePKs.includes(colName);
      const isUnique = /UNIQUE/i.test(rest);
      const isNotNull = /NOT\s+NULL/i.test(rest);
      const isOptional = !isNotNull && !isInlinePk;

      let defaultValue: string | undefined;
      const defMatch = rest.match(/DEFAULT\s+([^,\s]+)/i);
      if (defMatch) {
        defaultValue = defMatch[1].replace(/["']/g, '');
      }

      // Check inline REFERENCES target(col)
      const inlineFkMatch = rest.match(
        /REFERENCES\s+[`"\[]?([A-Za-z0-9_]+)[`"\]]?\s*(?:\(([^)]+)\))?(?:\s+ON\s+DELETE\s+(CASCADE|RESTRICT|SET\s+NULL|NO\s+ACTION))?/i
      );
      let isRelation = false;
      let relationFromFields: string[] | undefined;
      let relationToFields: string[] | undefined;

      if (inlineFkMatch) {
        isRelation = true;
        const targetRaw = inlineFkMatch[1];
        const toCol = inlineFkMatch[2] ? inlineFkMatch[2].replace(/[`"\[\]\s]/g, '') : 'id';
        const targetModel = targetRaw
          .split('_')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join('');

        relationFromFields = [colName];
        relationToFields = [toCol];

        edges.push({
          id: `fk-inline-${modelName}-${targetModel}-${colName}`,
          sourceModel: modelName,
          sourceField: colName,
          targetModel,
          targetField: toCol,
          cardinality: isUnique ? '1:1' : '1:N',
          onDelete: inlineFkMatch[3] as any,
          isOptional,
          label: `${colName} ➔ ${targetModel}.${toCol}`,
        });
      }

      fields.push({
        name: colName,
        type: rawDataType.toUpperCase(),
        isId: isInlinePk,
        isUnique,
        isOptional,
        isRelation,
        relationFromFields,
        relationToFields,
        defaultValue,
      });
    }

    const col = modelIndex % 4;
    const row = Math.floor(modelIndex / 4);

    models.push({
      name: modelName,
      tableName: rawTableName,
      domain: 'Tables',
      domainColor: domainColors[modelIndex % domainColors.length],
      description: `SQL Table "${rawTableName}" with ${fields.length} columns`,
      fields,
      x: 80 + col * 350,
      y: 80 + row * 400,
    });

    modelIndex++;
  }

  // 2. Extract standalone ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY
  const alterFkRegex = /ALTER\s+TABLE\s+[`"\[]?([A-Za-z0-9_]+)[`"\]]?\s+ADD\s+(?:CONSTRAINT\s+[`"\[]?[A-Za-z0-9_]+[`"\]]?\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+[`"\[]?([A-Za-z0-9_]+)[`"\]]?\s*\(([^)]+)\)(?:\s+ON\s+DELETE\s+(CASCADE|RESTRICT|SET\s+NULL|NO\s+ACTION))?/gi;
  let alterMatch: RegExpExecArray | null;

  while ((alterMatch = alterFkRegex.exec(cleanSql)) !== null) {
    const srcRaw = alterMatch[1];
    const fromCol = alterMatch[2].replace(/[`"\[\]\s]/g, '');
    const targetRaw = alterMatch[3];
    const toCol = alterMatch[4].replace(/[`"\[\]\s]/g, '');
    const onDel = alterMatch[5];

    const sourceModel = srcRaw.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    const targetModel = targetRaw.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');

    // Mark field as relation in model if present
    const sm = models.find((m) => m.name === sourceModel);
    if (sm) {
      const f = sm.fields.find((field) => field.name === fromCol);
      if (f) {
        f.isRelation = true;
        f.relationFromFields = [fromCol];
        f.relationToFields = [toCol];
      }
    }

    edges.push({
      id: `alter-fk-${sourceModel}-${targetModel}-${fromCol}`,
      sourceModel,
      sourceField: fromCol,
      targetModel,
      targetField: toCol,
      cardinality: '1:N',
      onDelete: onDel as any,
      isOptional: false,
      label: `${fromCol} ➔ ${targetModel}.${toCol}`,
    });
  }

  return { models, edges, enums };
}

// -------------------------------------------------------------
// PRE-LOADED SAMPLE SCHEMAS
// -------------------------------------------------------------
export const SAMPLE_ECOMMERCE_SQL = `-- E-Commerce Platform SQL DDL Schema
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'CUSTOMER',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL UNIQUE,
  slug VARCHAR(150) NOT NULL UNIQUE,
  parent_id INT,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  category_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) UNIQUE,
  price DECIMAL(10, 2) NOT NULL,
  stock_quantity INT DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

CREATE TABLE product_variants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  color VARCHAR(50),
  size VARCHAR(50),
  additional_price DECIMAL(10, 2) DEFAULT 0,
  inventory_count INT DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  order_number VARCHAR(64) UNIQUE NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

CREATE TABLE payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL UNIQUE,
  provider VARCHAR(50) NOT NULL,
  transaction_ref VARCHAR(100) UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'PAID',
  paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE shipping_addresses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  street_address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  country_code VARCHAR(2) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  rating INT NOT NULL,
  title VARCHAR(200),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
`;

export const SAMPLE_SAAS_BILLING_SQL = `-- Multi-tenant SaaS & Subscription Billing Schema
CREATE TABLE organizations (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  billing_email VARCHAR(255),
  plan_tier VARCHAR(50) DEFAULT 'FREE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  avatar_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE memberships (
  id VARCHAR(36) PRIMARY KEY,
  org_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  role VARCHAR(50) DEFAULT 'MEMBER',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE subscriptions (
  id VARCHAR(36) PRIMARY KEY,
  org_id VARCHAR(36) NOT NULL UNIQUE,
  stripe_subscription_id VARCHAR(100) UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  seat_count INT DEFAULT 5,
  current_period_end TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE TABLE invoices (
  id VARCHAR(36) PRIMARY KEY,
  org_id VARCHAR(36) NOT NULL,
  amount_cents INT NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'PAID',
  invoice_pdf_url VARCHAR(500),
  due_date TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE TABLE api_keys (
  id VARCHAR(36) PRIMARY KEY,
  org_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100),
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  org_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36),
  action VARCHAR(100) NOT NULL,
  target_resource VARCHAR(100),
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
`;

export const SAMPLE_SOCIAL_PRISMA = `// Social Media & Content Platform Schema
model User {
  id        String    @id @default(cuid())
  username  String    @unique
  email     String    @unique
  bio       String?
  avatar    String?
  posts     Post[]
  comments  Comment[]
  likes     Like[]
  followers Follow[]  @relation("Followers")
  following Follow[]  @relation("Following")
  createdAt DateTime  @default(now())
}

model Post {
  id        String     @id @default(cuid())
  authorId  String
  author    User       @relation(fields: [authorId], references: [id], onDelete: Cascade)
  content   String
  imageUrl  String?
  comments  Comment[]
  likes     Like[]
  tags      PostTag[]
  createdAt DateTime   @default(now())
}

model Comment {
  id        String   @id @default(cuid())
  postId    String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  text      String
  createdAt DateTime @default(now())
}

model Like {
  id        String   @id @default(cuid())
  postId    String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([postId, userId])
}

model Follow {
  followerId  String
  follower    User   @relation("Following", fields: [followerId], references: [id], onDelete: Cascade)
  followingId String
  following   User   @relation("Followers", fields: [followingId], references: [id], onDelete: Cascade)

  @@id([followerId, followingId])
}

model Tag {
  id    String    @id @default(cuid())
  name  String    @unique
  posts PostTag[]
}

model PostTag {
  postId String
  post   Post   @relation(fields: [postId], references: [id], onDelete: Cascade)
  tagId  String
  tag    Tag    @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([postId, tagId])
}
`;
