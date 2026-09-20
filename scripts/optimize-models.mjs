import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
// Tool-only dependencies live outside the app. See docs/technical/GLB-ASSETS.md.
const toolRoot = process.env.BRIGHTORIA_ASSET_TOOLS;
if (!toolRoot) throw new Error('Set BRIGHTORIA_ASSET_TOOLS to the directory containing tooling node_modules.');
const resolveTool = createRequire(path.join(toolRoot, 'package.json'));
const dependency = name => import(pathToFileURL(resolveTool.resolve(name)).href);
const { NodeIO } = await dependency('@gltf-transform/core');
const { ALL_EXTENSIONS } = await dependency('@gltf-transform/extensions');
const { prune, dedup, weld, simplify, textureCompress, meshopt } = await dependency('@gltf-transform/functions');
const { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } = await dependency('meshoptimizer');
const { default: sharp } = await dependency('sharp');
await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder});
const models = [
 ['assets-source/models/meshy-pulaunumeria.glb', 'pulau-numeria.glb', 14000, 1024],
 ['assets-source/models/meshy-pulauenglish.glb', 'pulau-english.glb', 14000, 1024],
 ['assets-source/models/meshy-pulauadab.glb', 'pulau-adab.glb', 14000, 1024],
 ['meshypesawat.glb', 'pesawat.glb', 7500, 512],
 ['assets-source/models/meshy-pulauquran2.glb', 'pulau-quran.glb', 14000, 1024],
 ['meshy-pulauquran.glb', 'pulau-arabic.glb', 14000, 1024],
 ['meshy-pulau-digital.glb', 'pulau-digital.glb', 14000, 1024],
 ['meshy-pulau-tower.glb', 'menara.glb', 18000, 1024],
 ['assets-source/models/bri.glb', 'bri.glb', 7000, 512],
];
const triangles = doc => doc.getRoot().listMeshes().reduce((sum,m)=>sum+m.listPrimitives().reduce((n,p)=>n+(p.getIndices()?.getCount()??p.getAttribute('POSITION').getCount())/3,0),0);
const only = process.argv.slice(2);
const report = only.length ? JSON.parse(await fs.readFile('docs/technical/glb-optimization.json', 'utf8')) : [];
for (const [input, name, budget, size] of models) {
 if (only.length && !only.includes(name)) continue;
 const doc=await io.read(input), before=triangles(doc);
 await doc.transform(dedup(),prune(),weld(),simplify({simplifier:MeshoptSimplifier,ratio:budget/before,error:0.01}),textureCompress({encoder:sharp,targetFormat:'webp',resize:[size,size],quality:80}),prune());
 const after=triangles(doc);
 await doc.transform(meshopt({encoder:MeshoptEncoder,level:'high'}));
 const output='public/assets/models/'+name;
 await io.write(output,doc);
 const record={input,output,beforeBytes:(await fs.stat(input)).size,afterBytes:(await fs.stat(output)).size,beforeTriangles:before,afterTriangles:after};
 const existing = report.findIndex(item => item.output === output);
 if (existing >= 0) report[existing] = record; else report.push(record);
 console.log(JSON.stringify(record));
}
await fs.writeFile('docs/technical/glb-optimization.json',JSON.stringify(report,null,2)+'\n');

