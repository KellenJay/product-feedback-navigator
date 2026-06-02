import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { companyStore, INDUSTRIES, STAGES, type Company } from "./companyStore";
import { checklistStore } from "@/components/onboarding/checklistStore";
import { DocumentUploader } from "@/components/common/DocumentUploader";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  company?: Company | null;
}

export function CompanyDialog({ open, onOpenChange, company }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState<string>("");
  const [website, setWebsite] = useState("");
  const [stage, setStage] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (open) {
      setName(company?.name ?? "");
      setDescription(company?.description ?? "");
      setIndustry(company?.industry ?? "");
      setWebsite(company?.website_url ?? "");
      setStage(company?.stage ?? "");
    }
  }, [open, company]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Company name is required");
      return;
    }
    if (website && !/^https?:\/\//i.test(website)) {
      toast.error("Website must start with http:// or https://");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        industry: industry || null,
        website_url: website.trim() || null,
        stage: stage || null,
      };
      if (company) {
        await companyStore.update(company.id, payload);
        toast.success("Company updated");
      } else {
        await companyStore.create(payload);
        void checklistStore.mark("company_added");
        toast.success("Company added");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{company ? "Edit company" : "Add company"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Company / Product name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Inc." className="mt-1.5" />
          </div>
          <div>
            <Label>What does it do?</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              placeholder="A short description, 2-3 sentences max"
              className="mt-1.5"
              rows={3}
            />
          </div>
          <div>
            <Label>Industry</Label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select industry" /></SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Website URL <span className="text-foreground-muted font-normal">(optional)</span></Label>
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourproduct.com"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Stage</Label>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select stage" /></SelectTrigger>
              <SelectContent>
                {STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="border-t border-border pt-4">
            <Label className="mb-2 block">Knowledge documents</Label>
            {company && userId ? (
              <DocumentUploader
                scope={{ kind: "company", companyId: company.id, userId }}
                label="Files attached to this company"
                maxFiles={10}
              />
            ) : (
              <p className="text-[12px] text-foreground-muted">
                Save the company first, then reopen this dialog to upload documents (logos, PRDs, brand guides, etc.).
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {company ? "Save changes" : "Save company"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
