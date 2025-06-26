import { DataManager } from "@sosarciel-cdda/event";
import { BoolObj, Eoc, EocEffect, EocID, Spell } from "@sosarciel-cdda/schema";
import { UNDef } from "./UNDefine";
import { FULL_RECIVERY_EOCID, DESTORY_U_EOCID, CON_SPELL_FLAG } from "./BaseData";
import {JObject} from '@zwa73/utils';
import { SPAWN_LOC_ID, UNIQUE_NPC_MUTID } from "./Export";







/**全局UniqueNPC的数量 */
const UniqueNpcCountVarID = "UniqueNpcCount";

/**根据编号获得全局UniqueNPC的charid存储变量 */
const UniqueNpcID = (str:string)=>`UniqueNpcID_${str}`;

/**生成遍历npc的eoc */
export const eachCharEoc = (id:EocID,effectList:EocEffect[],cond?:BoolObj,forceId?:boolean)=>UNDef.genActEoc(id,[
    {math:['eachIndex','=','0']},
    {
        run_eocs:{
            id:'EachNpcUntilInline',
            eoc_type:'ACTIVATION',
            effect:[
                {u_message:"each <global_val:eachIndex>"},
                {math:['eachIndex','+=','1']},
                {set_string_var:UniqueNpcID(`<global_val:eachIndex>`),target_var:{context_val:'charidPtr'},parse_tags:true},
                {run_eocs:{
                    id:`${id}_runeocwithinline`,
                    eoc_type:'ACTIVATION',
                    effect:effectList
                },
                alpha_talker:{var_val:'charidPtr'}},
            ],
        },
        iterations: {math:[UniqueNpcCountVarID]}
        //condition:{ math:['_eachIndex','<=',UniqueNpcCountVarID] },
    }
],cond,forceId);




//npc保护
export async function buildNpcProtect(dm:DataManager){
    const out:JObject[] = [];


    //递归随机传送
    const randTeleportEocID = UNDef.genEOCID('RandTeleport');
    const randTeleport = UNDef.genActEoc(randTeleportEocID,[
        {u_location_variable:{context_val:'tmploc'}},
        {location_variable_adjust:{context_val:'tmploc'},
            x_adjust: {math:['rand(2)-1']},
            y_adjust: {math:['rand(2)-1']}
        } as any,
        {run_eoc_with:{
            id:`RandTeleport_runeocwithinline`,
            eoc_type:'ACTIVATION',
            effect:[ {if:'u_is_character',then:[{run_eocs:[randTeleportEocID]}]} ],
        }, alpha_loc:{context_val:'tmploc'} },
        {u_teleport:{context_val:'tmploc'},force:true},
    ],undefined,true);
    out.push(randTeleport);

    //传送到出生点
    const teleportToSpawn = UNDef.genActEoc('TeleportToSpawn',[
        {run_eocs:{
            id:`TeleportToSpawn_runeocwithinline`,
            eoc_type:'ACTIVATION',
            effect:[ {if:'u_is_character',then:[{run_eocs:[randTeleport.id]}]} ],
        }, alpha_loc:{global_val:SPAWN_LOC_ID} },
        {u_teleport:{global_val:SPAWN_LOC_ID},force:true},
    ]);
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


    //初始化Npc
    const InitNpc:Eoc = UNDef.genActEoc('InitNpc',[
        {set_string_var:'<u_name>',target_var:{context_val:'uname'},parse_tags:true},
        {
            if:{math:[`v_uname`,'>=','1']},
            then:[{run_eocs:[DESTORY_U_EOCID]}],
            else:[
                {math:[UIsVaildNpc,'=','1']},
                {math:[`v_uname`,'=','1']},
                {math:[UniqueNpcCountVarID,'+=','1'] },
                {set_string_var:UniqueNpcID(`<global_val:${UniqueNpcCountVarID}>`),target_var:{context_val:'charidPtr'},parse_tags:true},
                {u_set_talker: { var_val: "charidPtr" } },
            ],
        }
    ],{u_has_trait:UNIQUE_NPC_MUTID});
    dm.addInvokeID('Init',0,InitNpc.id);
    out.push(InitNpc);

    //召集npc法术
    const GatheringEoc:Eoc = eachCharEoc('Gathering',[
        {run_eocs:[teleportToSpawn.id]},
    ])
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
    out.push(GatheringEoc,GatheringSpell);



    dm.addData(out,'protect');
}