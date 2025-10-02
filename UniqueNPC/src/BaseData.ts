import { DataManager } from "@sosarciel-cdda/event";
import { Eoc, Item, Mutation, NpcClass, NpcInstance } from "@sosarciel-cdda/schema";
import { UNDef } from "./Define";
import { JObject } from "@zwa73/utils";
import { UNIQUE_NPC_MUTID } from "./Export";


const UniqueNpcMut: Mutation = {
    id: UNIQUE_NPC_MUTID,
    name: "独特的NPC",
    purifiable: false,
    valid: false,
    player_display: false,
    points: 0,
    type: "mutation",
    description: "独特NPC标志",
};

export const DESTORY_U_EOCID = "DestoryU";
const KillUEoc: Eoc = {
    id: DESTORY_U_EOCID,
    eoc_type: "ACTIVATION",
    type: "effect_on_condition",
    effect: [
        {u_location_variable:{global_val:"tmp_loc"},z_adjust:-10,z_override:true},
        {u_teleport:{global_val:"tmp_loc"},force:true},
        {math:[`u_hp('ALL')`,'=','0']},
        //{run_eocs:{
        //    id:"KillUFutureInline",
        //    eoc_type:'ACTIVATION',
        //    effect:[{
        //        u_map_run_item_eocs: "all",
        //        search_data: [{ id: "corpse" as AnyItemID }],
        //        loc: {global_val:"tmp_loc"},
        //        min_radius: 0,
        //        max_radius: 0,
        //        true_eocs: [{
        //            id: "KillUFutureSearchInline",
        //            eoc_type: "ACTIVATION",
        //            effect: ["npc_die"],
        //        }],
        //    }]
        //},
        //time_in_future:1
        //},
    ],
};

/**用于必定成功的控制法术的flags */
export const CON_SPELL_FLAG = ["SILENT", "NO_HANDS", "NO_LEGS", "NO_FAIL","NO_EXPLOSION_SFX"] as const;


const TestNpcClass:NpcClass={
    type:'npc_class',
    id:UNDef.genNpcClassID("TestClass"),
    name:"UniqueNpcTestClass",
    job_description:"UniqueNPC测试职业",
    common:false,
    traits:[
        {trait:UniqueNpcMut.id}
    ],
}
const TestNpcInstance:NpcInstance={
    type:"npc",
    id:UNDef.genNpcInstanceID("TestNpc"),
    class:TestNpcClass.id,
    //name_unique:'UniqueNpcTestInstance',
    attitude: 0,
    mission: 0,
    faction: "your_followers",
    chat: "TALK_DONE",
}
/**生成器 */
const TestNpcSpawner:Item={
    type:"ITEM",
    "//copy": false,
    "//GENERIC": true,
    id:UNDef.genItemID('TestNpcSpawner'),
    name:{str_sp:`UniqueNpc测试生成器`},
    description:`生成一个 UniqueNpc`,
    use_action:{
        type:"effect_on_conditions",
        description:`生成一个 UniqueNpc`,
        menu_text: `生成一个 UniqueNpc`,
        effect_on_conditions:[UNDef.genEocID('TestNpcSpawner')],
    },
    weight:`1 mg`,
    volume:`1 ml`,
    symbol: "O"
}
/**生成器EOC */
const TestNpcSpawnerEoc: Eoc = {
    type: "effect_on_condition",
    eoc_type:"ACTIVATION",
    id: UNDef.genEocID('TestNpcSpawner'),
    effect: [
        {
            u_spawn_npc: TestNpcInstance.id,
            real_count: 1,
            min_radius: 1,
            max_radius: 1,
        },
    ],
};

/**完全回复EOC */
export const FULL_RECIVERY_EOCID = UNDef.genEocID("FullRecovery");
/**完全回复 */
const FullRecivery: Eoc = {
    type: "effect_on_condition",
    eoc_type: "ACTIVATION",
    id: FULL_RECIVERY_EOCID,
    effect: [
        "u_prevent_death",
        { math: ["u_calories()", "=", "max( u_calories(), 9000)"] },
        { math: ["u_val('thirst')", "=", "min( u_val('thirst'), 800)"] },
        { math: ["u_vitamin('redcells')", "=", "0"] },
        { math: ["u_vitamin('bad_food')", "=", "0"] },
        { math: ["u_vitamin('blood')", "=", "0"] },
        { math: ["u_vitamin('instability')", "=", "0"] },
        { math: ["u_pain()", "=", "0"] },
        { math: ["u_val('rad')", "=", "0"] },
        { math: ["u_hp('ALL')", "=", "999"] },
        //{ u_set_hp: 1000, max: true},
        { u_add_effect: "cureall", duration: "1 s", intensity: 1 },
        { u_add_effect: "panacea", duration: "30 s", intensity: 1 },
        { u_lose_effect: "corroding" },
        { u_lose_effect: "onfire" },
        { u_lose_effect: "dazed" },
        { u_lose_effect: "stunned" },
        { u_lose_effect: "venom_blind" },
        { u_lose_effect: "formication" },
        { u_lose_effect: "blisters" },
        { u_lose_effect: "frostbite" },
        { u_lose_effect: "frostbite_recovery" },
        { u_lose_effect: "wet" },
        { u_lose_effect: "slimed" },
        { u_lose_effect: "migo_atmosphere" },
        { u_lose_effect: "fetid_goop" },
        { u_lose_effect: "sap" },
        { u_lose_effect: "nausea" },
        { u_lose_effect: "bleed" },
    ],
};

export async function buildBaseData(dm: DataManager) {
    const out: JObject[] = [UniqueNpcMut, FullRecivery,KillUEoc,TestNpcClass,TestNpcInstance,TestNpcSpawner,TestNpcSpawnerEoc];
    dm.addData(out, "base");
}
