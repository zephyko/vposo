import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileText, X } from "lucide-react";

interface ScriptInputProps {
  text: string;
  onChange: (text: string) => void;
  onClear: () => void;
  maxLength?: number;
}

export function ScriptInput({ text, onChange, onClear, maxLength = 5000 }: ScriptInputProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <Label htmlFor="script" className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Script
        </Label>
        {text.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear text
          </Button>
        )}
      </div>
      
      <div className="flex-1 flex flex-col">
        <Textarea
          id="script"
          placeholder="Paste your script or type here…"
          value={text}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 min-h-[300px] lg:min-h-[400px] resize-none bg-muted/30 border-border/50 text-base leading-relaxed p-4 focus:border-primary/50"
          maxLength={maxLength}
        />
        <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
          <span className="opacity-70">Maximum {maxLength.toLocaleString()} characters</span>
          <span className={text.length > maxLength * 0.9 ? "text-warning" : ""}>
            {text.length.toLocaleString()} / {maxLength.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
