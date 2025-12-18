import {
    cyrConvert,
    emptyFencer,
    emptyFencerStatus, emptyStatus,
    Fencer,
    type FencerStatus,
    type Status,
    toSeconds,
    toTime
} from "./Classes.ts";
import {CountryList, reverseCountryList} from "./Country.ts";

export class Cyrano {
    protocol: "EFP1" | "EFP1.1"
    com: "HELLO" | "DISP" | "ACK" | "NAK" | "INFO" | "NEXT" | "PREV"
    piste: string
    compe: string
    phase: number | ""
    status: Status
    ref: Fencer
    leftfencer: FencerStatus
    rightfencer: FencerStatus
    constructor(
        protocol: "EFP1" | "EFP1.1",
        com: "HELLO" | "DISP" | "ACK" | "NAK" | "INFO" | "NEXT" | "PREV",
        piste: string,
        compe: string,
        phase: number,
        status: Status,
        ref: Fencer,
        leftfencer: FencerStatus,
        rightfencer: FencerStatus,
    )
    constructor(
        protocol: "EFP1" | "EFP1.1",
        com: "HELLO" | "DISP" | "ACK" | "NAK" | "INFO" | "NEXT" | "PREV",
        piste: string,
        compe: string,
        ...args: any[]
    )
    constructor(input: string)
    constructor(
        inputProtocol: "EFP1" | "EFP1.1" | string,
        com: "HELLO" | "DISP" | "ACK" | "NAK" | "INFO" | "NEXT" | "PREV" = "HELLO",
        piste: string = "",
        compe: string = "",
        phase: number | "" = "",
        status: Status = emptyStatus,
        ref: Fencer = emptyFencer,
        leftfencer: FencerStatus = emptyFencerStatus,
        rightfencer: FencerStatus = emptyFencerStatus,
    ) {
        if (inputProtocol == "EFP1" || inputProtocol == "EFP1.1") {
            this.protocol = inputProtocol
            this.com = com
            this.piste = piste
            this.compe = compe
            this.phase = phase
            this.status = status
            this.ref = ref
            this.leftfencer = leftfencer
            this.rightfencer = rightfencer
        } else {
            const sections = inputProtocol.split("%")
            const section1s = sections[0]?.split("|") ?? []
            if (section1s[1] !== "EFP1" && section1s[1] !== "EFP1.1") {
                throw new TypeError("Not a valid Cyrano message, " + String(section1s[1]) + " is not a valid protocol")
            }
            this.protocol = section1s[1]
            if (
                section1s[2] !== "HELLO"
                && section1s[2] !== "DISP"
                && section1s[2] !== "ACK"
                && section1s[2] !== "NAK"
                && section1s[2] !== "INFO"
                && section1s[2] !== "NEXT"
                && section1s[2] !== "PREV"
            ) {
                throw new TypeError("Not a valid Cyrano message, " + String(section1s[2]) + " is not a valid com")
            }
            this.com = section1s[2]
            if (typeof section1s[3] === "undefined" || typeof section1s[4] === "undefined") {
                throw new TypeError("Not a valid Cyrano message, " + String(section1s[3])
                    + " or " + String(section1s[3]) + " is not valid")
            }
            this.piste = section1s[3]
            this.compe = section1s[4]
            if (this.com === "DISP" && (
                typeof section1s[5] === "undefined"
                || typeof section1s[6] === "undefined"
                || typeof section1s[7] === "undefined"
                || typeof section1s[8] === "undefined"
            )) {
                throw new TypeError("Not a valid Cyrano message")
            }
            this.phase = cyrConvert(Number, section1s[5])
            this.status = {
                poultab: section1s[6] ?? "",
                match: cyrConvert(Number, section1s[7]),
                round: cyrConvert(Number, section1s[8]),
                time: section1s[9] ?? "",
                stopwatch: toSeconds(section1s[10]),
                type: section1s[11] as "I" | "T" ?? "",
                weapon: section1s[12] as "F" | "E" | "S" ?? "",
                priority: section1s[13] as "N" | "L" | "R" ?? "",
                state: section1s[14] as "F" | "H" | "P" | "W" | "E" ?? ""
            }
            this.ref = new Fencer(
                section1s[15] ?? "",
                section1s[16] ?? "",
                CountryList[section1s[17] ?? ""] ?? "",
                ""
            )
            const section2 = sections[1]
            if (typeof section2 === "undefined") {
                this.leftfencer = emptyFencerStatus
            } else {
                const section2s = section2.split("|")
                this.leftfencer = {
                    fencer: new Fencer(
                        section2s[1] ?? "",
                        section2s[2] ?? "",
                        CountryList[section2s[3] ?? ""] ?? "",
                        ""),
                    score: cyrConvert(Number, section2s[4]),
                    status: section2s[5] as "U" | "V" | "D" | "A" | "E" ?? "",
                    ycard: cyrConvert(Boolean, cyrConvert(Number, section2s[6])),
                    rcard: cyrConvert(Number, section2s[7]),
                    light: cyrConvert(Boolean, cyrConvert(Number, section2s[8])),
                    wlight: cyrConvert(Boolean, cyrConvert(Number, section2s[9])),
                    medical: cyrConvert(Number, section2s[10]),
                    reserve: section2s[11] as "N" | "R" ?? "",
                }
            }
            const section3 = sections[2]
            if (typeof section3 === "undefined") {
                this.rightfencer = emptyFencerStatus
            } else {
                const section3s = section3.split("|")
                this.rightfencer = {
                    fencer: new Fencer(
                        section3s[1] ?? "",
                        section3s[2] ?? "",
                        CountryList[section3s[3] ?? ""] ?? "",
                        ""),
                    score: cyrConvert(Number, section3s[4]),
                    status: section3s[5] as "U" | "V" | "D" | "A" | "E" ?? "",
                    ycard: cyrConvert(Boolean, cyrConvert(Number, section3s[6])),
                    rcard: cyrConvert(Number, section3s[7]),
                    light: cyrConvert(Boolean, cyrConvert(Number, section3s[8])),
                    wlight: cyrConvert(Boolean, cyrConvert(Number, section3s[9])),
                    medical: cyrConvert(Number, section3s[10]),
                    reserve: section3s[11] as "N" | "R" ?? "",
                }
            }
        }
    }

    toString(includeStart = true) {
        const string1:string = [
            "",
            this.protocol,
            this.com,
            this.piste,
            this.compe,
            String(this.phase),
            this.status.poultab,
            String(this.status.match),
            String(this.status.round),
            this.status.time,
            toTime(this.status.stopwatch),
            this.status.type,
            this.status.weapon,
            this.status.priority,
            this.status.state,
            String(this.ref.id),
            this.ref.name.toString(
                false, false, false, " ", ""
            ),
            reverseCountryList[this.ref.country],
            ""
        ].join("|").replace(/\|*$/, "|")
        const string2 = [
            "",
            String(this.leftfencer.fencer.id),
            this.leftfencer.fencer.name.toString(
                false, false, false, " ", ""
            ),
            reverseCountryList[this.leftfencer.fencer.country],
            String(this.leftfencer.score),
            this.leftfencer.status,
            String(cyrConvert(Number, this.leftfencer.ycard)),
            String(this.leftfencer.rcard),
            String(cyrConvert(Number, this.leftfencer.light)),
            String(cyrConvert(Number, this.leftfencer.wlight)),
            String(this.leftfencer.medical),
            this.leftfencer.reserve,
            ""
        ].join("|").replace(/\|*$/, "|")
        const string3 = [
            "",
            String(this.rightfencer.fencer.id),
            this.rightfencer.fencer.name.toString(
                false, false, false, " ", ""
            ),
            reverseCountryList[this.rightfencer.fencer.country],
            String(this.rightfencer.score),
            this.rightfencer.status,
            String(cyrConvert(Number, this.rightfencer.ycard)),
            String(this.rightfencer.rcard),
            String(cyrConvert(Number, this.rightfencer.light)),
            String(cyrConvert(Number, this.rightfencer.wlight)),
            String(this.rightfencer.medical),
            this.rightfencer.reserve,
            ""
        ].join("|").replace(/\|*$/, "|")
        return [
            string1,
            string2,
            string3,
            "|"
            ].join("%").replace(/(%\|)*$/, "%|")
    }
}