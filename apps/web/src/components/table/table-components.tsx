import { Ref } from 'react';
import {
  ScrollerProps,
  TableComponents as TableComponentsType,
  ItemProps,
} from 'react-virtuoso';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function VirtualTableRow({ item: _item, ...props }: ItemProps<any>) {
  return (
    <tr
      {...props}
      className="border-b border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface)]"
    />
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TableComponents: TableComponentsType<any, any> = {
  Scroller: function Scroller(
    props: ScrollerProps & { ref?: Ref<HTMLDivElement> },
  ) {
    return (
      <div
        {...props}
        ref={props.ref}
        className="w-full overflow-auto rounded-md border border-[var(--color-border)]"
      />
    );
  },
  Table: function VirtualTable(props: React.HTMLAttributes<HTMLTableElement>) {
    return (
      <table
        {...props}
        style={{ borderCollapse: 'separate', ...props.style }}
        className="w-full caption-bottom text-sm"
      />
    );
  },
  TableHead: function VirtualTableHead(
    props: React.HTMLAttributes<HTMLTableSectionElement> & {
      ref?: Ref<HTMLTableSectionElement>;
    },
  ) {
    return (
      <thead
        {...props}
        ref={props.ref}
        className="border-b border-[var(--color-border)] bg-[var(--color-surface)]"
      />
    );
  },
  TableFoot: function VirtualTableFoot(
    props: React.HTMLAttributes<HTMLTableSectionElement> & {
      ref?: Ref<HTMLTableSectionElement>;
    },
  ) {
    return <tfoot {...props} ref={props.ref} />;
  },
  TableRow: VirtualTableRow,
  TableBody: function BodyTable(
    props: React.HTMLAttributes<HTMLTableSectionElement> & {
      ref?: Ref<HTMLTableSectionElement>;
    },
  ) {
    return <tbody {...props} ref={props.ref} />;
  },
};

export default TableComponents;
