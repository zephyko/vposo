import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Search, Mic2, Palette, Layers } from "lucide-react";

export type VoiceTypeFilter = "all" | "cloned" | "designed";

interface VoiceFiltersProps {
  typeFilter: VoiceTypeFilter;
  onTypeFilterChange: (value: VoiceTypeFilter) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function VoiceFilters({
  typeFilter,
  onTypeFilterChange,
  searchQuery,
  onSearchChange,
}: VoiceFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      {/* Type Filter */}
      <ToggleGroup
        type="single"
        value={typeFilter}
        onValueChange={(value) => value && onTypeFilterChange(value as VoiceTypeFilter)}
        className="bg-secondary/50 rounded-lg p-1"
      >
        <ToggleGroupItem
          value="all"
          aria-label="Show all voices"
          className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-4"
        >
          <Layers className="h-4 w-4 mr-2" />
          All
        </ToggleGroupItem>
        <ToggleGroupItem
          value="cloned"
          aria-label="Show cloned voices"
          className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-4"
        >
          <Mic2 className="h-4 w-4 mr-2" />
          Cloned
        </ToggleGroupItem>
        <ToggleGroupItem
          value="designed"
          aria-label="Show designed voices"
          className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-4"
        >
          <Palette className="h-4 w-4 mr-2" />
          Designed
        </ToggleGroupItem>
      </ToggleGroup>

      {/* Search Box */}
      <div className="relative flex-1 w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search voices..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  );
}
