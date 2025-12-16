import {Fencer, type FencerStatus, type Status} from "./Classes.ts";
import {CountryList, reverseCountryList} from "./Country.ts";

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
        phase?: number,
        status?: Status,
        refid?: string,
        refname?: string,
        refnat?: string,
        leftfencer?: FencerStatus,
        rightfencer?: FencerStatus,
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
            const sections = inputProtocol.split("%")
            // @ts-ignore
            const section1s = sections[0].split("|")
            if (section1s[1] !== "EFP1" && section1s[1] !== "EFP1.1") {
                throw new TypeError("Not a valid Cyrano message")
            }
            this.protocol = section1s[1]
            if (
                section1s[2] !== "HELLO"
                && section1s[2] !== "DISP"
                && section1s[2] !== "ACK"
                && section1s[2] !== "NAK"
            ) {
                throw new TypeError("Not a valid Cyrano message")
            }
            this.com = section1s[2]
            if (typeof section1s[3] === "undefined" || typeof section1s[4] === "undefined") {
                throw new TypeError("Not a valid Cyrano message")
            }
            this.piste = section1s[3]
            this.compe = section1s[4]
            if (this.com !== "HELLO") {
                if (this.com === "DISP" && (
                    typeof section1s[5] === "undefined"
                    || typeof section1s[6] === "undefined"
                    || typeof section1s[7] === "undefined"
                    || typeof section1s[8] === "undefined"
                )) {
                    throw new TypeError("Not a valid Cyrano message")
                }
                this.phase = Number(section1s[5])
                this.status = {
                    pooltab: section1s[6],
                    match: Number(section1s[7]),
                    round: Number(section1s[8]),
                    time: section1s[9],
                    stopwatch: Number(section1s[10]),
                    type: section1s[11],
                    weapon: section1s[12],
                    priority: section1s[13],
                    state: section1s[14]
                }
                this.refid = section1s[15]
                this.refname = section1s[16]
                this.refnat = section1s[17]
                const section2 = sections[1]
                if (typeof section2 !== "undefined") {
                    const section2s = section2.split("|")
                    this.leftfencer = {
                        fencer: new Fencer(Number(section2s[1]), section2s[2], CountryList[section2s[3] ?? ""], ""),
                        score: Number(section2s[4]),
                        status: section2s[5],
                        ycard: Boolean(section2s[6]),
                        rcard: Number(section2s[7]),
                        light: Boolean(section2s[8]),
                        wlight: Boolean(section2s[9]),
                        medical: Number(section2s[10]),
                        reserve: Boolean(section2s[11]),
                    }
                }
                const section3 = sections[2]
                if (typeof section3 !== "undefined") {
                    const section3s = section3.split("|")
                    this.leftfencer = {
                        fencer: new Fencer(
                            Number(section3s[1]),
                            section3s[2],
                            CountryList[section3s[3] ?? ""]
                            , ""
                        ),
                        score: Number(section3s[4]),
                        status: section3s[5],
                        ycard: Boolean(section3s[6]),
                        rcard: Number(section3s[7]),
                        light: Boolean(section3s[8]),
                        wlight: Boolean(section3s[9]),
                        medical: Number(section3s[10]),
                        reserve: Boolean(section3s[11]),
                    }
                }
            }
        }
    }

    toString() {
        const array:string[] = [
            "",
            this.protocol,
            this.com,
            this.piste,
            this.compe,
            String(this.phase),
            this.status?.pooltab ?? "",
            String(this.status?.match ?? ""),
            String(this.status?.round ?? ""),
            this.status?.time ?? "",
            String(this.status?.stopwatch ?? ""),
            this.status?.type ?? "",
            this.status?.weapon ?? "",
            this.status?.priority ?? "",
            "%",
            String(this.leftfencer?.fencer?.id ?? ""),
            this.leftfencer?.fencer?.name?.toString() ?? "",
            reverseCountryList[this.leftfencer?.fencer?.country ?? ""] ?? "",
            String(this.leftfencer?.score ?? ""),
            this.leftfencer?.status ?? "",
            this.leftfencer?.ycard ?? "",
            this.leftfencer?.rcard ?? "",
            this.leftfencer?.light ?? "",
            this.leftfencer?.wlight ?? "",
            this.leftfencer?.medical ?? "",
            this.leftfencer?.reserve ?? "",
            "%",
            String(this.leftfencer?.fencer?.id ?? ""),
            this.leftfencer?.fencer?.name?.toString() ?? "",
            reverseCountryList[this.leftfencer?.fencer?.country ?? ""] ?? "",
            String(this.leftfencer?.score ?? ""),
            this.rightfencer?.status ?? "",
            this.rightfencer?.ycard ?? "",
            this.rightfencer?.rcard ?? "",
            this.rightfencer?.light ?? "",
            this.rightfencer?.wlight ?? "",
            this.rightfencer?.medical ?? "",
            this.rightfencer?.reserve ?? "",
            "%",
            ""
        ]
        return array.join("|")
    }
}