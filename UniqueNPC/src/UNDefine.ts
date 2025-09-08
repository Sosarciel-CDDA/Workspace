import path from 'pathe';
import { GAME_MOD_DIR, ModDefine } from '@sosarciel-cdda/schema';




export const UNDef = new ModDefine("UNPC");
export const DATA_PATH = path.join(process.cwd(),'data');
export const ENV_PATH = path.join(process.cwd(),'..');
export const OUT_PATH = path.join(GAME_MOD_DIR,'UniqueNPC');