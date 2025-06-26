import { DataManager } from "@sosarciel-cdda/event";
import { DATA_PATH, OUT_PATH } from "./UNDefine";
import { buildBaseData } from "./BaseData";
import { buildNpcProtect } from "./NpcProtect";





export async function build(){
    const undm = new DataManager(DATA_PATH,OUT_PATH,"CNPCUNEF",{enableMoveStatus:false});
    await buildBaseData(undm);
    await buildNpcProtect(undm);
    await undm.saveAllData();
}