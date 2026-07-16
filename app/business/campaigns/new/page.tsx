import Link from "next/link";
import { Button } from "@whop/react/components";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { CampaignWizard } from "@/components/business/campaign-wizard";
import { getUserBalance } from "@/lib/services/ledger";
import { requireBusinessUserId } from "@/app/business/require-user";

export default async function NewCampaignPage() {
  const userId = await requireBusinessUserId("/business/campaigns/new");
  const balanceCents = await getUserBalance(userId);

  return (
    <main className="mx-auto w-full max-w-[1120px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <BusinessPageHeader
        eyebrow="New campaign"
        title="Create work people can finish"
        description="Set the outcome, define the evidence, and fund every available slot when you are ready to publish."
        actions={
          <Button asChild color="gray" variant="ghost">
            <Link href="/business">Cancel</Link>
          </Button>
        }
      />
      <div className="mt-8">
        <CampaignWizard balanceCents={balanceCents} />
      </div>
    </main>
  );
}
