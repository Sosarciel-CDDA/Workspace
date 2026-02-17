import { DataManager } from "@sosarciel-cdda/event";
import { DATA_PATH, OUT_PATH } from "./Define";
import { buildBaseData } from "./BaseData";
import { buildNpcProtect } from "./NpcProtect";





export async function build(){
    const undm = new DataManager({
        dataPath:DATA_PATH,
        outPath:OUT_PATH,
        emPrefix:"CNPCUNEF",
        hookOpt:{enableMoveStatus:false}
    });
    await buildBaseData(undm);
    await buildNpcProtect(undm);
    await undm.saveAllData();
}