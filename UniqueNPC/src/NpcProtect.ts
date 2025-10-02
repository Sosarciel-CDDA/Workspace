import { DataManager } from "@sosarciel-cdda/event";
import { Eoc, Spell } from "@sosarciel-cdda/schema";
import { UNDef } from "./Define";
import { FULL_RECIVERY_EOCID, DESTORY_U_EOCID, CON_SPELL_FLAG } from "./BaseData";
import {JObject} from '@zwa73/utils';
import { SPAWN_LOC_ID, UNIQUE_NPC_MUTID } from "./Export";







/**全局UniqueNPC的数量 */
const uniqueNpcCount = "UniqueNpcCount";

/**根据编号获得全局UniqueNPC的charid存储变量 */
const uniqueNpcID = (str:string)=>`UniqueNpcID_${str}`;
const eachIdx  = "EachChar_EachIndex";
const charIdPtr = 'CharIdPtr'


/**生成遍历npc的eoc */
const eachCharEocInput = "EachChar_InputEocId";
const eachCharEoc:Eoc = {
    type:"effect_on_condition",
    id:UNDef.genEocID('EachChar'),
    effect:[
        {math:[eachIdx,'=','0']},
        {
            run_eocs:{
                id:UNDef.genEocID('EachChar_Until'),
                eoc_type:'ACTIVATION',
                effect:[
                    {u_message:`each <global_val:${eachIdx}>`},
                    {math:[eachIdx,'+=','1']},
                    {set_string_var:uniqueNpcID(`<global_val:${eachIdx}>`),target_var:{context_val:charIdPtr},parse_tags:true},
                    {run_eocs:{global_val:eachCharEocInput}, alpha_talker:{var_val:charIdPtr}},
                ],
            },
            iterations: {math:[uniqueNpcCount]}
            //condition:{ math:['_eachIndex','<=',UniqueNpcCountVarID] },
        }
    ]
}




//npc保护
export async function buildNpcProtect(dm:DataManager){
    const out:JObject[] = [];


    //递归随机传送
    const randTeleportEocID = UNDef.genEocID('RandTeleport');
    const randTeleport:Eoc = {
        type:"effect_on_condition",
        eoc_type:'ACTIVATION',
        id:randTeleportEocID,
        effect:[
            {u_location_variable:{context_val:'tmploc'}},
            {location_variable_adjust:{context_val:'tmploc'},
                x_adjust: {math:['rand(2)-1']},
                y_adjust: {math:['rand(2)-1']}
            },
            {run_eocs:{
                id:`RandTeleport_runeocwithinline`,
                eoc_type:'ACTIVATION',
                effect:[ {if:'u_is_character',then:[{run_eocs:[randTeleportEocID]}]} ],
            }, alpha_loc:{context_val:'tmploc'} },
            {u_teleport:{context_val:'tmploc'},force:true},
        ],
    }
    out.push(randTeleport);

    //传送到出生点
    const teleportToSpawn = {
        type:"effect_on_condition",
        eoc_type:'ACTIVATION',
        id:UNDef.genEocID('TeleportToSpawn'),
        effect: [
            {run_eocs:{
                id:`TeleportToSpawn_runeocwithinline`,
                eoc_type:'ACTIVATION',
                effect:[ {if:'u_is_character',then:[{run_eocs:[randTeleport.id]}]} ],
            }, alpha_loc:{global_val:SPAWN_LOC_ID} },
            {u_teleport:{global_val:SPAWN_LOC_ID},force:true},
        ]
    }
    out.push(teleportToSpawn);

    /**alpha是有效的npc */
    const UIsVaildNpc = 'u_isVaildUniqueNpc';
    //死亡保护
    const pdeath:Eoc=UNDef.genActEoc('DeathRebirth',[
        {run_eocs:[teleportToSpawn.id,FULL_RECIVERY_EOCID]},
    ],{or:[
        {math:[UIsVaildNpc,'==','1']},
        'u_is_avatar',
    ]});
    dm.addInvokeID('DeathPrev',-100,pdeath.id);
    out.push(pdeath);


    //出生点设置
    const spawnLocSet:Eoc=UNDef.genActEoc('SpawnLocSet',[
        {u_location_variable:{global_val:SPAWN_LOC_ID}},
    ]);
    dm.addInvokeID('GameStart',0,spawnLocSet.id);
    out.push(spawnLocSet);

    //用于判断全局唯一的指针
    const uname = 'isUniquePtr';
    //初始化Npc
    const InitNpc:Eoc = UNDef.genActEoc('InitNpc',[
        {set_string_var:'<u_name>',target_var:{context_val:uname},parse_tags:true},
        {if:{math:[`v_${uname}`,'>=','1']},
        then:[{run_eocs:[DESTORY_U_EOCID]}],
        else:[
            {math:[UIsVaildNpc,'=','1']},
            {math:[`v_${uname}`,'=','1']},
            {math:[uniqueNpcCount,'+=','1'] },
            {set_string_var:uniqueNpcID(`<global_val:${uniqueNpcCount}>`),target_var:{context_val:charIdPtr},parse_tags:true},
            {u_set_talker: { var_val: charIdPtr } },
        ]}
    ],{u_has_trait:UNIQUE_NPC_MUTID});
    dm.addInvokeID('Init',0,InitNpc.id);
    out.push(InitNpc);

    //召集npc法术
    const GatheringSubEoc:Eoc = {
        type:'effect_on_condition',
        id:UNDef.genEocID('GatheringSub'),
        eoc_type:"ACTIVATION",
        effect:[ {run_eocs:[teleportToSpawn.id]} ]
    }
    const GatheringEoc:Eoc = {
        type:'effect_on_condition',
        id:UNDef.genEocID('Gathering'),
        eoc_type:"ACTIVATION",
        effect:[
            {set_string_var:GatheringSubEoc.id,target_var:{global_val:eachCharEocInput}},
            {run_eocs:[eachCharEoc.id]},
        ]
    }
    const GatheringSpell:Spell = {
        id:UNDef.genSpellID('Gathering'),
        name:"召集",
        description:"召集所有npc回到出生点",
        type:'SPELL',
        effect:'effect_on_condition',
        effect_str:GatheringEoc.id,
        valid_targets:['self'],
        shape:'blast',
        flags:[...CON_SPELL_FLAG],
    }
    out.push(GatheringEoc,GatheringSubEoc,GatheringSpell,eachCharEoc);



    dm.addData(out,'protect');
}