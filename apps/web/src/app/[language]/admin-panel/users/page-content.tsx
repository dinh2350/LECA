'use client';

import { RoleEnum } from '@/services/api/types/role';
import withPageRequiredAuth from '@/services/auth/with-page-required-auth';
import { useTranslation } from '@/services/i18n/client';
import { PropsWithChildren, useCallback, useMemo, useState } from 'react';
import { useGetUsersListQuery, usersQueryKeys } from './queries/queries';
import { TableVirtuoso } from 'react-virtuoso';
import { User } from '@/services/api/types/user';
import Link from '@/components/link';
import useAuth from '@/services/auth/use-auth';
import useConfirmDialog from '@/components/confirm-dialog/use-confirm-dialog';
import { useDeleteUsersService } from '@/services/api/services/users';
import removeDuplicatesFromArrayObjects from '@/services/helpers/remove-duplicates-from-array-of-objects';
import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import UserFilter from './user-filter';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserFilterType, UserSortType } from './user-filter-types';
import { SortEnum } from '@/services/api/types/sort-type';
import TableComponents from '@/components/table/table-components';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';

type UsersKeys = keyof User;

function SortIcon({
  orderBy,
  column,
  order,
}: {
  orderBy: UsersKeys;
  column: UsersKeys;
  order: SortEnum;
}) {
  if (orderBy !== column)
    return <ChevronsUpDown className="h-3 w-3 ml-1 opacity-40" />;
  return order === SortEnum.ASC ? (
    <ChevronUp className="h-3 w-3 ml-1 text-[var(--color-accent)]" />
  ) : (
    <ChevronDown className="h-3 w-3 ml-1 text-[var(--color-accent)]" />
  );
}

function TableSortCellWrapper(
  props: PropsWithChildren<{
    width?: number;
    orderBy: UsersKeys;
    order: SortEnum;
    column: UsersKeys;
    handleRequestSort: (
      event: React.MouseEvent<unknown>,
      property: UsersKeys,
    ) => void;
  }>,
) {
  return (
    <th
      style={{ width: props.width }}
      className="text-left px-4 py-2 text-xs font-medium text-[var(--color-muted)] uppercase tracking-wide"
    >
      <button
        type="button"
        className="flex items-center hover:text-[var(--color-foreground)] transition-colors"
        onClick={(event) => props.handleRequestSort(event, props.column)}
      >
        {props.children}
        <SortIcon
          orderBy={props.orderBy}
          column={props.column}
          order={props.order}
        />
      </button>
    </th>
  );
}

function Actions({ user }: { user: User }) {
  const { user: authUser } = useAuth();
  const { confirmDialog } = useConfirmDialog();
  const fetchUserDelete = useDeleteUsersService();
  const queryClient = useQueryClient();
  const canDelete = user.id !== authUser?.id;
  const { t: tUsers } = useTranslation('admin-panel-users');

  const handleDelete = async () => {
    const isConfirmed = await confirmDialog({
      title: tUsers('admin-panel-users:confirm.delete.title'),
      message: tUsers('admin-panel-users:confirm.delete.message'),
    });

    if (isConfirmed) {
      const searchParams = new URLSearchParams(window.location.search);
      const searchParamsFilter = searchParams.get('filter');
      const searchParamsSort = searchParams.get('sort');

      let filter: UserFilterType | undefined = undefined;
      let sort: UserSortType | undefined = {
        order: SortEnum.DESC,
        orderBy: 'id',
      };

      if (searchParamsFilter) {
        filter = JSON.parse(searchParamsFilter);
      }

      if (searchParamsSort) {
        sort = JSON.parse(searchParamsSort);
      }

      const previousData = queryClient.getQueryData<
        InfiniteData<{ nextPage: number; data: User[] }>
      >(usersQueryKeys.list().sub.by({ sort, filter }).key);

      await queryClient.cancelQueries({ queryKey: usersQueryKeys.list().key });

      const newData = {
        ...previousData,
        pages: previousData?.pages.map((page) => ({
          ...page,
          data: page?.data.filter((item) => item.id !== user.id),
        })),
      };

      queryClient.setQueryData(
        usersQueryKeys.list().sub.by({ sort, filter }).key,
        newData,
      );

      await fetchUserDelete({ id: user.id });
    }
  };

  const editButton = (
    <Button size="sm" asChild>
      <Link href={`/admin-panel/users/edit/${user.id}`}>
        {tUsers('admin-panel-users:actions.edit')}
      </Link>
    </Button>
  );

  if (!canDelete) {
    return editButton;
  }

  return (
    <div className="flex items-center gap-1">
      {editButton}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="px-1">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="text-[var(--color-warn)] focus:text-[var(--color-warn)]"
            onClick={handleDelete}
          >
            {tUsers('admin-panel-users:actions.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function Users() {
  const { t: tUsers } = useTranslation('admin-panel-users');
  const { t: tRoles } = useTranslation('admin-panel-roles');
  const searchParams = useSearchParams();
  const router = useRouter();
  const [{ order, orderBy }, setSort] = useState<{
    order: SortEnum;
    orderBy: UsersKeys;
  }>(() => {
    const searchParamsSort = searchParams.get('sort');
    if (searchParamsSort) {
      return JSON.parse(searchParamsSort);
    }
    return { order: SortEnum.DESC, orderBy: 'id' };
  });

  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: UsersKeys,
  ) => {
    const isAsc = orderBy === property && order === SortEnum.ASC;
    const searchParams = new URLSearchParams(window.location.search);
    const newOrder = isAsc ? SortEnum.DESC : SortEnum.ASC;
    const newOrderBy = property;
    searchParams.set(
      'sort',
      JSON.stringify({ order: newOrder, orderBy: newOrderBy }),
    );
    setSort({ order: newOrder, orderBy: newOrderBy });
    router.push(window.location.pathname + '?' + searchParams.toString());
  };

  const filter = useMemo(() => {
    const searchParamsFilter = searchParams.get('filter');
    if (searchParamsFilter) {
      return JSON.parse(searchParamsFilter) as UserFilterType;
    }
    return undefined;
  }, [searchParams]);

  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useGetUsersListQuery({ filter, sort: { order, orderBy } });

  const handleScroll = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const result = useMemo(() => {
    const result =
      (data?.pages.flatMap((page) => page?.data) as User[]) ?? ([] as User[]);
    return removeDuplicatesFromArrayObjects(result, 'id');
  }, [data]);

  return (
    <div className="max-w-7xl mx-auto px-4 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold text-[var(--color-foreground)]">
          {tUsers('admin-panel-users:title')}
        </h1>
        <div className="flex items-center gap-2">
          <UserFilter />
          <Button asChild>
            <Link href="/admin-panel/users/create">
              {tUsers('admin-panel-users:actions.create')}
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <TableVirtuoso
          style={{ height: 500 }}
          data={result}
          components={TableComponents}
          endReached={handleScroll}
          overscan={20}
          useWindowScroll
          increaseViewportBy={400}
          fixedHeaderContent={() => (
            <>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                <th style={{ width: 50 }} className="px-4 py-2" />
                <TableSortCellWrapper
                  width={100}
                  orderBy={orderBy}
                  order={order}
                  column="id"
                  handleRequestSort={handleRequestSort}
                >
                  {tUsers('admin-panel-users:table.column1')}
                </TableSortCellWrapper>
                <th
                  className="text-left px-4 py-2 text-xs font-medium text-[var(--color-muted)] uppercase tracking-wide"
                  style={{ width: 200 }}
                >
                  {tUsers('admin-panel-users:table.column2')}
                </th>
                <TableSortCellWrapper
                  orderBy={orderBy}
                  order={order}
                  column="email"
                  handleRequestSort={handleRequestSort}
                >
                  {tUsers('admin-panel-users:table.column3')}
                </TableSortCellWrapper>
                <th
                  className="text-left px-4 py-2 text-xs font-medium text-[var(--color-muted)] uppercase tracking-wide"
                  style={{ width: 80 }}
                >
                  {tUsers('admin-panel-users:table.column4')}
                </th>
                <th style={{ width: 130 }} className="px-4 py-2" />
              </tr>
              {isFetchingNextPage && (
                <tr>
                  <td colSpan={6} className="p-0">
                    <div className="w-full h-1 bg-[var(--color-accent)] animate-pulse" />
                  </td>
                </tr>
              )}
            </>
          )}
          itemContent={(_index, user) => (
            <>
              <td style={{ width: 50 }} className="px-4 py-2">
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={user?.photo?.path}
                    alt={`${user?.firstName} ${user?.lastName}`}
                  />
                  <AvatarFallback className="text-xs">
                    {[user?.firstName?.[0], user?.lastName?.[0]]
                      .filter(Boolean)
                      .join('')}
                  </AvatarFallback>
                </Avatar>
              </td>
              <td style={{ width: 100 }} className="px-4 py-2 text-sm">
                {user?.id}
              </td>
              <td style={{ width: 200 }} className="px-4 py-2 text-sm">
                {user?.firstName} {user?.lastName}
              </td>
              <td className="px-4 py-2 text-sm">{user?.email}</td>
              <td style={{ width: 80 }} className="px-4 py-2 text-sm">
                {tRoles(`role.${user?.role?.id}`)}
              </td>
              <td style={{ width: 130 }} className="px-4 py-2">
                {!!user && <Actions user={user} />}
              </td>
            </>
          )}
        />
      </div>
    </div>
  );
}

export default withPageRequiredAuth(Users, { roles: [RoleEnum.ADMIN] });
