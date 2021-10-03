const axios = require("axios")
const banks = require("./banks.json")
const vouchers = require("./vouchers.json")

const banksPerPage = 8

const network = axios.create({ baseURL: "https://sandboxapi.fsi.ng" })

/**
 *
 * @param message: The message coming from the USSD in the form 1*23*67
 * expected sequence
 * voucher_code * account_number * bank_code
 */
async function params(message) {
    const regex = {
        voucher: /\d{12}/,
        account_number: /\d{10}/,
        bank_id: /\d{1}/
    }
    const payload = {}
    let parts = message.split("*")
    if (message.length < 1) {
        return "CON Please enter the voucher code"
    }
    if (!regex.voucher.test(parts[0])) {
        return "END The voucher code does not look valid"
    }
    payload.voucher = parts[0]
    if (parts.length === 1) {
        return "CON Please enter the account number"
    }
    if (!regex.account_number.test(parts[1])) {
        return "END The account umber does not look correct"
    }
    payload.account_number = parts[1]
    parts = parts.splice(2)
    if (parts.filter(v => regex.bank_id.test(v)).length === 0) {
        return bankDisplay(parts)
    }
    payload.bank = resolveBank(parts)

    switch (parts.filter(v => regex.bank_id.test(v))[1]) {
        case null:
        case undefined:
            return await confirm(payload)
        case 1:
        case '1':
            return send(payload)
            break;
        default:
            return "END You have cancelled the operation"
    }
    return "END finish"
}

function bankDisplay(parts) {
    let start = parts.length * banksPerPage % parseInt(banks.length / banksPerPage)
    let end = Math.min(start + banksPerPage, banks.length)
    let message = "CON "
    for (let position = start; position < end; position++) {
        message += `\n ${(position % banksPerPage) + 1} ${banks[position].name}`
    }
    message += "\n-\n # more banks"
    return message
}

function resolveBank(parts) {
    let index = -1 // because we show user 1...n, instead of 0...n
    for (const part of parts) {
        if (part === '#') {
            console.log('add 8')
            index += banksPerPage
        } else {
            // use first numeric after # sequence to get index of bank
            return banks[index % banks.length + +part]
        }
    }
}

async function confirm(payload) {
    /*
    const account = await network.get("sterling/TransferAPIs/api/Spay/InterbankNameEnquiry?Referenceid=01&RequestType=01&Translocation=01&ToAccount=0037514051&destinationbankcode=000001",
        {
            headers: {
                "Sandbox-Key": "3c630dba871739d98b9e8157872b380d",
                "Ocp-Apim-Subscription-Key": "t",
                "Ocp-Apim-Trace": "true",
                "Appid": "69",
                "Content-Type": "application/json",
                "ipval": "0"
            }
        })
    */
    const value = getVoucherValue(payload.voucher)
    console.log({payload})
   
    if (value) {
        return `CON [Sandbox, no real money]\nPlease confirm that you're about to send NGN${value} to Prince Account (${payload.bank.name}) \n1. Confirm \n2. Cancel`
    } else {
        return `END You've provided an invalid voucher code`
    }
}

async function send(payload) {
    /*
    const r = await network.post("sterling/accountapi/api/Spay/InterbankTransferReq", {
        "Referenceid": "0101",
        "RequestType": "01",
        "Translocation": "0101",
        "SessionID": "01",
        "FromAccount": "01",
        "ToAccount": "01",
        "Amount": "01",
        "DestinationBankCode": "01",
        "NEResponse": "01",
        "BenefiName": "01",
        "PaymentReference": "01",
        "OriginatorAccountName": "01",
        "translocation": "01"
    }, {
        headers: {
            "Sandbox-Key": "3c630dba871739d98b9e8157872b380d",
            "Ocp-Apim-Subscription-Key": "t",
            "Ocp-Apim-Trace": "true",
            "Appid": "69",
            "Content-Type": "application/json",
            "ipval": "0"
        }
    })
    */
    return "END " + r.data.data.ResponseText
}

function getVoucherValue(code) {
    return vouchers.find(voucher => voucher.code === code)?.value
}

module.exports.handle = (message, session) => {
    return params(message)
}
