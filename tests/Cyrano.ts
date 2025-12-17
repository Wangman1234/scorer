import {Cyrano} from "../src/scripts/Cyrano";
import {cyrConvert} from "../src/scripts/Classes";

let messages = [
    "|EFP1|HELLO|17|fm-eq|%|",
    "|EFP1.1|INFO||||||||3:00||||W|%||||0|U|0|1|1|0|0|N|%||||0|U|0|1|0|0|0|N|%|",
    "|EFP1.1|INFO|17|efj-eq||||||3:00||||W|%||||8|V|0|1|1|0|0|N|%||||6|D|0|1|0|0|0|N|%|",
    "|EFP1.1|INFO|17|efj-eq|1|A32|12|2|10:30|3:00|I|S||W|132|" +
    "J.Smith|GBR|%|28|P.Martin|FRA|8|V|0|1|1|0|0|N|%|32|B. Panini|ITA|6|D|0|1|0|0|0|N|%|",
    "|EFP1.1|INFO||||||||||||W||%|"
]
let cyranos = [
    new Cyrano(
        "EFP1",
        "HELLO",
        "17",
        "fm-eq",
    )
]

let rec: boolean[] = []
let send: boolean[] = []
for (let msg in messages) {
    console.log(messages[msg])
    let cyrano0 = new Cyrano(messages[msg])
    // console.log(cyrano0)
    // console.log(messages[msg])
    console.log(cyrano0.toString())
    rec[msg] = messages[msg] === cyrano0.toString()
    console.log(rec[msg])
    // console.log(cyranos[msg])
    console.log(cyranos[msg]?.toString())
    send[msg] = cyranos[msg]?.toString() === messages[msg]
    console.log(send[msg])
    console.log("\n")
}

console.log(rec)
console.log(send)

const print = String(cyrConvert(Number, cyrConvert(Boolean, 0)))
console.log("printed ", print, " of type", typeof print);
