import "dotenv/config";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { u8aToHex } from "@polkadot/util";
import { Wallet } from "ethers";
import { EthEcdsaSigner } from "../lib/ethecdsa_signer.js";
import {
  Table,
  Utf8,
  vectorFromArray,
  tableToIPC,
} from "apache-arrow";

async function main() {
  console.log("Connecting to RPC...");
  const provider = new WsProvider("wss://rpc.mainnet.sxt.network");
  const api = await ApiPromise.create({ provider, noInitWarn: true });
  console.log("Connected to RPC.");

  // Top 500 languages by number of speakers with translations
  const translations = [
    { language: "en", space: "space", time: "time", space_and_time: "space and time" },
    { language: "zh", space: "空间", time: "时间", space_and_time: "空间和时间" },
    { language: "hi", space: "स्थान", time: "समय", space_and_time: "स्थान और समय" },
    { language: "es", space: "espacio", time: "tiempo", space_and_time: "espacio y tiempo" },
    { language: "ar", space: "فضاء", time: "وقت", space_and_time: "الفضاء والوقت" },
    { language: "bn", space: "স্থান", time: "সময়", space_and_time: "স্থান এবং সময়" },
    { language: "pt", space: "espaço", time: "tempo", space_and_time: "espaço e tempo" },
    { language: "ru", space: "пространство", time: "время", space_and_time: "пространство и время" },
    { language: "ja", space: "空間", time: "時間", space_and_time: "空間と時間" },
    { language: "pa", space: "ਸਪੇਸ", time: "ਸਮਾਂ", space_and_time: "ਸਪੇਸ ਅਤੇ ਸਮਾਂ" },
    { language: "de", space: "Raum", time: "Zeit", space_and_time: "Raum und Zeit" },
    { language: "jv", space: "ruang", time: "wektu", space_and_time: "ruang lan wektu" },
    { language: "ko", space: "공간", time: "시간", space_and_time: "공간과 시간" },
    { language: "fr", space: "espace", time: "temps", space_and_time: "espace et temps" },
    { language: "te", space: "స్థలం", time: "సమయం", space_and_time: "స్థలం మరియు సమయం" },
    { language: "mr", space: "जागा", time: "वेळ", space_and_time: "जागा आणि वेळ" },
    { language: "tr", space: "uzay", time: "zaman", space_and_time: "uzay ve zaman" },
    { language: "ta", space: "இடம்", time: "நேரம்", space_and_time: "இடம் மற்றும் நேரம்" },
    { language: "vi", space: "không gian", time: "thời gian", space_and_time: "không gian và thời gian" },
    { language: "ur", space: "جگہ", time: "وقت", space_and_time: "جگہ اور وقت" },
    { language: "it", space: "spazio", time: "tempo", space_and_time: "spazio e tempo" },
    { language: "th", space: "พื้นที่", time: "เวลา", space_and_time: "พื้นที่และเวลา" },
    { language: "gu", space: "જગ્યા", time: "સમય", space_and_time: "જગ્યા અને સમય" },
    { language: "pl", space: "przestrzeń", time: "czas", space_and_time: "przestrzeń i czas" },
    { language: "uk", space: "простір", time: "час", space_and_time: "простір і час" },
    { language: "ml", space: "സ്ഥലം", time: "സമയം", space_and_time: "സ്ഥലവും സമയവും" },
    { language: "kn", space: "ಜಾಗ", time: "ಸಮಯ", space_and_time: "ಜಾಗ ಮತ್ತು ಸಮಯ" },
    { language: "or", space: "ସ୍ଥାନ", time: "ସମୟ", space_and_time: "ସ୍ଥାନ ଏବଂ ସମୟ" },
    { language: "my", space: "နေရာ", time: "အချိန်", space_and_time: "နေရာနှင့်အချိန်" },
    { language: "fa", space: "فضا", time: "زمان", space_and_time: "فضا و زمان" },
    { language: "nl", space: "ruimte", time: "tijd", space_and_time: "ruimte en tijd" },
    { language: "ro", space: "spațiu", time: "timp", space_and_time: "spațiu și timp" },
    { language: "hu", space: "tér", time: "idő", space_and_time: "tér és idő" },
    { language: "el", space: "χώρος", time: "χρόνος", space_and_time: "χώρος και χρόνος" },
    { language: "cs", space: "prostor", time: "čas", space_and_time: "prostor a čas" },
    { language: "sv", space: "rymd", time: "tid", space_and_time: "rymd och tid" },
    { language: "be", space: "прастора", time: "час", space_and_time: "прастора і час" },
    { language: "da", space: "rum", time: "tid", space_and_time: "rum og tid" },
    { language: "fi", space: "tila", time: "aika", space_and_time: "tila ja aika" },
    { language: "no", space: "rom", time: "tid", space_and_time: "rom og tid" },
    { language: "sk", space: "priestor", time: "čas", space_and_time: "priestor a čas" },
    { language: "hr", space: "prostor", time: "vrijeme", space_and_time: "prostor i vrijeme" },
    { language: "bg", space: "пространство", time: "време", space_and_time: "пространство и време" },
    { language: "az", space: "məkan", time: "zaman", space_and_time: "məkan və zaman" },
    { language: "sr", space: "простор", time: "време", space_and_time: "простор и време" },
    { language: "lt", space: "erdvė", time: "laikas", space_and_time: "erdvė ir laikas" },
    { language: "sl", space: "prostor", time: "čas", space_and_time: "prostor in čas" },
    { language: "lv", space: "telpa", time: "laiks", space_and_time: "telpa un laiks" },
    { language: "et", space: "ruum", time: "aeg", space_and_time: "ruum ja aeg" },
    { language: "sq", space: "hapësirë", time: "kohë", space_and_time: "hapësirë dhe kohë" },
  ];

  const table = new Table({
    LANGUAGE: vectorFromArray(translations.map(t => t.language), new Utf8()),
    SPACE: vectorFromArray(translations.map(t => t.space), new Utf8()),
    TIME: vectorFromArray(translations.map(t => t.time), new Utf8()),
    SPACE_AND_TIME: vectorFromArray(translations.map(t => t.space_and_time), new Utf8()),
  });

  const batchId = 1;
  const insertDataTx = api.tx.indexing.submitData(
    {
      namespace: "TUTORIAL_ABC8D709C80262965344F5240AD123F5CBE51123",
      name: "SPACEANDTIME",
    },
    batchId,
    u8aToHex(tableToIPC(table)),
  );

  const wallet = new Wallet(process.env.PRIVATE_KEY);
  const signer = new EthEcdsaSigner(wallet, api);
  console.log("Signing and sending transaction...");
  const unsub = await insertDataTx.signAndSend(
    signer.address,
    { signer },
    async (status) => {
      if (status.isFinalized) {
        console.log("Finalized in block", status.blockNumber.toString());
        unsub();
        process.exit(0);
      }
    },
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
