import { PrismaModel, PrismaEnum } from '../data/schemaData';

export function generatePostgreSql(model: PrismaModel, enums: PrismaEnum[]): string {
  const tableName = model.tableName || model.name.toLowerCase() + 's';
  const lines: string[] = [];

  lines.push(`-- PostgreSQL DDL for "${model.name}" (mapped to "${tableName}")`);
  lines.push(`CREATE TABLE "${tableName}" (`);

  const columnDefs: string[] = [];
  const foreignKeyConstraints: string[] = [];

  for (const field of model.fields) {
    if (field.isRelation && field.type.endsWith('[]')) {
      continue; // Virtual reverse relation
    }
    if (field.isRelation && !field.relationFromFields) {
      continue; // Virtual 1:1 or 1:N reference field
    }

    let colName = field.name;
    let colType = 'TEXT';
    
    // Check if type matches enum
    const isEnum = enums.some(e => e.name === field.type);
    if (isEnum) {
      colType = `"${field.type}"`;
    } else {
      switch (field.type) {
        case 'String':
          colType = field.isId ? 'VARCHAR(36)' : 'TEXT';
          break;
        case 'Int':
          colType = 'INTEGER';
          break;
        case 'Float':
          colType = 'DOUBLE PRECISION';
          break;
        case 'Boolean':
          colType = 'BOOLEAN';
          break;
        case 'DateTime':
          colType = 'TIMESTAMP WITH TIME ZONE';
          break;
        default:
          colType = 'TEXT';
      }
    }

    let constraints = '';
    if (field.isId) {
      constraints += ' PRIMARY KEY';
    } else if (!field.isOptional) {
      constraints += ' NOT NULL';
    }

    if (field.isUnique && !field.isId) {
      constraints += ' UNIQUE';
    }

    if (field.defaultValue) {
      if (field.defaultValue === 'now()') {
        constraints += ' DEFAULT CURRENT_TIMESTAMP';
      } else if (field.defaultValue === 'cuid()') {
        constraints += ' DEFAULT gen_random_uuid()';
      } else if (field.defaultValue === 'true' || field.defaultValue === 'false') {
        constraints += ` DEFAULT ${field.defaultValue.toUpperCase()}`;
      } else {
        constraints += ` DEFAULT ${field.defaultValue}`;
      }
    }

    columnDefs.push(`  "${colName}" ${colType}${constraints}`);

    if (field.isRelation && field.relationFromFields && field.relationToFields) {
      const refModel = field.type;
      const refTable = refModel.toLowerCase() + 's';
      const fromCol = field.relationFromFields[0];
      const toCol = field.relationToFields[0];
      const onDel = field.onDelete ? ` ON DELETE ${field.onDelete.toUpperCase()}` : '';
      foreignKeyConstraints.push(
        `  CONSTRAINT "fk_${tableName}_${fromCol}" FOREIGN KEY ("${fromCol}") REFERENCES "${refTable}" ("${toCol}")${onDel}`
      );
    }
  }

  const allDefinitions = [...columnDefs, ...foreignKeyConstraints];
  lines.push(allDefinitions.join(',\n'));
  lines.push(');');

  // Add indexes if any
  if (model.indexes && model.indexes.length > 0) {
    lines.push('');
    lines.push(`-- Indexes`);
    model.indexes.forEach((idx, i) => {
      const cleanIdx = idx.replace(/[\[\]]/g, '');
      const idxCols = cleanIdx.split(',').map(s => `"${s.trim()}"`).join(', ');
      lines.push(`CREATE INDEX "idx_${tableName}_${i + 1}" ON "${tableName}" (${idxCols});`);
    });
  }

  return lines.join('\n');
}

export function generateTypeScript(model: PrismaModel): string {
  const lines: string[] = [];
  lines.push(`export interface ${model.name} {`);

  for (const field of model.fields) {
    let tsType = 'string';
    switch (field.type) {
      case 'String':
        tsType = 'string';
        break;
      case 'Int':
      case 'Float':
        tsType = 'number';
        break;
      case 'Boolean':
        tsType = 'boolean';
        break;
      case 'DateTime':
        tsType = 'Date';
        break;
      default:
        tsType = field.type;
    }

    if (field.isList) {
      tsType = `${tsType.replace('[]', '')}[]`;
    }

    const opt = field.isOptional ? '?' : '';
    lines.push(`  ${field.name}${opt}: ${tsType};`);
  }

  lines.push('}');
  return lines.join('\n');
}
