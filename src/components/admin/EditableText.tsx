import { useState, useEffect } from "react";
import { Check, Pencil, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAdminModeStore } from "@/stores/adminModeStore";
import { useAdmin } from "@/hooks/useAdmin";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface EditableTextProps {
  id: string; // Unique ID for saving to DB (e.g. 'home_hero_title', 'product_desc_123')
  defaultText: string;
  className?: string;
  type?: "input" | "textarea";
  onSave?: (newValue: string) => void;
  table?: string; // Optional: specify table to save to (defaults to 'site_config' if we implement that)
  field?: string; // Optional: specify field name
}

export function EditableText({ 
  id, 
  defaultText, 
  className = "", 
  type = "input",
  onSave 
}: EditableTextProps) {
  const { isAdminModeActive } = useAdminModeStore();
  const { isAdmin } = useAdmin();
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(defaultText);
  const [savedValue, setSavedValue] = useState(defaultText);

  // Sync with prop if it changes externally
  useEffect(() => {
    setValue(defaultText);
    setSavedValue(defaultText);
  }, [defaultText]);

  const handleSave = async () => {
    try {
      if (onSave) {
        onSave(value);
      } else {
        // Default saving logic could go here if we had a generic 'site_content' table
        // For now we rely on onSave prop for specific implementations
        console.log("Saving", id, value);
      }
      setSavedValue(value);
      setIsEditing(false);
      toast.success("Texto actualizado");
    } catch (error) {
      toast.error("Error al guardar");
      console.error(error);
    }
  };

  const handleCancel = () => {
    setValue(savedValue);
    setIsEditing(false);
  };

  if (!isAdmin || !isAdminModeActive) {
    return <span className={className}>{savedValue}</span>;
  }

  if (isEditing) {
    return (
      <div className="flex items-start gap-2 animate-in fade-in">
        {type === "textarea" ? (
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="min-h-[100px] w-full bg-background/80 border-primary"
            autoFocus
          />
        ) : (
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-8 w-full bg-background/80 border-primary"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
          />
        )}
        <div className="flex flex-col gap-1">
          <button
            onClick={handleSave}
            className="p-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
          >
            <Check className="h-3 w-3" />
          </button>
          <button
            onClick={handleCancel}
            className="p-1 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <span 
      className={`relative group cursor-pointer border border-transparent hover:border-primary/30 hover:bg-primary/5 rounded px-1 -mx-1 transition-all ${className}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsEditing(true);
      }}
      title="Clic para editar"
    >
      {savedValue}
      <span className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground text-[10px] px-1 rounded shadow-sm">
        <Pencil className="h-2 w-2 inline mr-0.5" />
        Editar
      </span>
    </span>
  );
}
