const fs = require('fs');
const path = require('path');

const filesToPatch = [
  'apps/web/app/admin/inventory/InventoryTableClient.tsx',
  'apps/web/app/admin/categories/AdminCategoriesClient.tsx',
  'apps/web/app/admin/suppliers/AdminSuppliersClient.tsx',
  'apps/web/app/admin/products/AdminProductsClient.tsx',
  'apps/web/app/admin/finances/AdminFinancesClient.tsx'
];

for (const file of filesToPatch) {
  const fullPath = path.join('/Users/alibourak/Documents/CodingProjects/StemoryBlooms', file);
  if (!fs.existsSync(fullPath)) continue;
  
  let content = fs.readFileSync(fullPath, 'utf-8');
  
  // 1. Add imports
  if (!content.includes('useSearchParams')) {
    content = content.replace(/import React, {([^}]*)} from 'react';/, "import React, { $1 } from 'react';\nimport { useSearchParams } from 'next/navigation';\nimport { TablePagination } from '../../../components/ui/TablePagination';");
  }
  
  // 2. Add searchParams logic inside the component
  const componentMatch = content.match(/export function \w+\([^)]+\) {/);
  if (componentMatch && !content.includes('const searchParams = useSearchParams()')) {
    const componentStart = componentMatch.index + componentMatch[0].length;
    
    // Find the state variable name (e.g., setMaterials, setCategories)
    const stateMatch = content.match(/const \[(\w+), set\w+\] = useState\(/);
    const varName = stateMatch ? stateMatch[1] : null;
    
    if (varName) {
      const injection = `
  const searchParams = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;
  const paginatedItems = ${varName}.slice((page - 1) * limit, page * limit);
`;
      content = content.slice(0, componentStart) + injection + content.slice(componentStart);
      
      // 3. Replace mapping over varName with paginatedItems
      const mapRegex = new RegExp(`${varName}\\.map\\(`, 'g');
      content = content.replace(mapRegex, 'paginatedItems.map(');
      
      // 4. Inject TablePagination below the table or grid
      if (content.includes('</table>')) {
        content = content.replace('</table>', `</table>\n        <TablePagination totalItems={${varName}.length} />`);
      } else if (content.includes('</div>\n  );\n}')) {
        // fallback for products grid
        content = content.replace(/<\/div>\n\s*\);\n}/, `  <TablePagination totalItems={${varName}.length} />\n    </div>\n  );\n}`);
      }
      
      fs.writeFileSync(fullPath, content, 'utf-8');
      console.log(`Patched ${file}`);
    }
  }
}
