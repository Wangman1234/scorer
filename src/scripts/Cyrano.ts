import {Fencer, type FencerStatus, type Status} from "./Classes.ts";
import {CountryList} from "./Country.ts";

export class Cyrano {
    protocol: "EFP1" | "EFP1.1"
    com: "HELLO" | "DISP" | "ACK" | "NAK" | "INFO" | "NEXT" | "PREV"
    piste: string
    compe: string
    phase?: number
    status?: Status
    refid?: string
    refname?: string
    refnat?: string
    leftfencer?: FencerStatus
    rightfencer?: FencerStatus
    constructor(
        protocol: "EFP1" | "EFP1.1",
        com: "HELLO" | "DISP" | "ACK" | "NAK" | "INFO" | "NEXT" | "PREV",
        piste: string,
        compe: string,
        phase: number,
        status: Status,
        refid: string,
        refname: string,
        refnat: string,
        leftfencer: FencerStatus,
        rightfencer: FencerStatus,
    )
    constructor(input: string)
    constructor(
        inputProtocol: "EFP1" | "EFP1.1" | string,
        com: "HELLO" | "DISP" | "ACK" | "NAK" | "INFO" | "NEXT" | "PREV" = "HELLO",
        piste: string = "",
        compe: string = "",
        phase: number = -1,
        status: Status = {
            pooltab: "",
            match: -1,
            round: -1,
            time: "",
            stopwatch: -1,
            type: "I",
            weapon: "F",
            priority: "N",
            state: "H",
        },
        refid: string = "",
        refname: string = "",
        refnat: string = "",
        leftfencer: FencerStatus = {
            fencer: new Fencer(-1, ",", CountryList.CAN, ""),
            score: -1,
            status: "U",
            ycard: false,
            rcard: 0,
            light: false,
            wlight: false,
            medical: 0,
            reserve: false
        },
        rightfencer: FencerStatus = {
            fencer: new Fencer(-1, ",", CountryList.CAN, ""),
            score: -1,
            status: "U",
            ycard: false,
            rcard: 0,
            light: false,
            wlight: false,
            medical: 0,
            reserve: false
        },
    ) {
        if (inputProtocol == "EFP1" || inputProtocol == "EFP1.1") {
            this.protocol = inputProtocol
            this.com = com
            this.piste = piste
            this.compe = compe
            this.phase = phase
            this.status = status
            this.refid = refid
            this.refname = refname
            this.refnat = refnat
            this.leftfencer = leftfencer
            this.rightfencer = rightfencer
        } else {
            let sections = inputProtocol.split("%")
            // @ts-ignore
            let section1 = sections[0].split("|")
            if (section1[1] !== "EFP1" && section1[1] !== "EFP1.1") {
                throw new TypeError("Not a valid Cyrano message")
            }
            this.protocol = section1[1]
            this.com = section1[2]
            this.piste = section1[3]
            this.compe = section1[4]
            if (this.com !== "HELLO") {

            }
        }
    }
}