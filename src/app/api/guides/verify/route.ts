import { verifyGuide } from "@/lib/research/share";
import { readLimitedText } from "@/lib/research/request";
export async function POST(request: Request) {
  let raw: string;
  try { raw = await readLimitedText(request,25000); }
  catch { return Response.json({error:"This link is too large."},{status:413}); }
  try {
    const {token} = JSON.parse(raw);
    if(typeof token !== "string") throw new Error();
    return Response.json({guide:verifyGuide(token)},{headers:{"Cache-Control":"no-store"}});
  } catch { return Response.json({error:"This guide link is invalid or was created with a different signing key. Ask the sender for a new link."},{status:400}); }
}
