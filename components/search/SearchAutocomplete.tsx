import { SearchBox } from "@/components/search/SearchBox";

export function SearchAutocomplete({
  id,
  suggestions,
  defaultValue,
  placeholder,
  className,
  inputClassName,
}: {
  id: string;
  suggestions: string[];
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}) {
  return (
    <>
      <SearchBox
        listId={id}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={className}
        inputClassName={inputClassName}
      />
      <datalist id={id}>
        {suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </>
  );
}
