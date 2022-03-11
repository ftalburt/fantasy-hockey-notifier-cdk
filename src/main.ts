import "dotenv/config";
import "source-map-support/register";
import { main } from "./fantasy-hockey-notifier.api";

main().catch(console.error);
