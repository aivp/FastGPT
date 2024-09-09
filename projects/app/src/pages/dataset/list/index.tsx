import React, { useState, useMemo } from 'react';
import {
  Box,
  Flex,
  Image,
  Button,
  useDisclosure,
  Input,
  InputGroup,
  InputLeftElement
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import PageContainer from '@/components/PageContainer';
import { useTranslation } from 'next-i18next';
import { serviceSideProps } from '@/web/common/utils/i18n';
import ParentPaths from '@/components/common/folder/Path';
import { useDatasetStore } from '@/web/core/dataset/store/dataset';
import List from './component/List';
import { DatasetsContext } from './context';
import DatasetContextProvider from './context';
import { useContextSelector } from 'use-context-selector';
import MyMenu from '@fastgpt/web/components/common/MyMenu';
import { AddIcon } from '@chakra-ui/icons';
import { useUserStore } from '@/web/support/user/useUserStore';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { FolderIcon, FolderImgUrl } from '@fastgpt/global/common/file/image/constants';
import { EditFolderFormType } from '@fastgpt/web/components/common/MyModal/EditFolderModal';
import dynamic from 'next/dynamic';
import { postCreateDataset, putDatasetById, createAdDatasets } from '@/web/core/dataset/api';
import { DatasetTypeEnum } from '@fastgpt/global/core/dataset/constants';
import FolderSlideCard from '@/components/common/folder/SlideCard';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import {
  DatasetDefaultPermissionVal,
  DatasetPermissionList
} from '@fastgpt/global/support/permission/dataset/constant';
import {
  postUpdateDatasetCollaborators,
  deleteDatasetCollaborators,
  getCollaboratorList
} from '@/web/core/dataset/api/collaborator';
import { on } from 'events';

import { useI18n } from '@/web/context/I18n';

const EditFolderModal = dynamic(
  () => import('@fastgpt/web/components/common/MyModal/EditFolderModal')
);

const CreateModal = dynamic(() => import('./component/CreateModal'));

const Dataset = () => {
  const { isPc } = useSystemStore();
  const { t } = useTranslation();

  const { datasetT } = useI18n();

  const router = useRouter();
  const { parentId } = router.query as { parentId: string };

  const { myDatasets } = useDatasetStore();

  const {
    paths,
    isFetchingDatasets,
    refetchPaths,
    refetchDatasets,
    folderDetail,
    setEditedDataset,
    setMoveDatasetId,
    onDelDataset,
    searchKey,
    setSearchKey
  } = useContextSelector(DatasetsContext, (v) => v);
  const { userInfo } = useUserStore();

  const [editFolderData, setEditFolderData] = useState<EditFolderFormType>();

  const RenderSearchInput = useMemo(
    () => (
      <InputGroup maxW={['auto', '250px']} height={'36px'}>
        <InputLeftElement h={'full'} alignItems={'center'} display={'flex'}>
          <MyIcon color={'myGray.300'} name={'common/searchLight'} w={'1rem'} />
        </InputLeftElement>
        <Input
          value={searchKey}
          size={'md'}
          h={'36px'}
          onChange={(e) => setSearchKey(e.target.value)}
          placeholder={datasetT('Search dataset')+'...'}
          maxLength={30}
          bg={'white'}
        />
      </InputGroup>
    ),
    [searchKey, setSearchKey]
  );

  const {
    isOpen: isOpenCreateModal,
    onOpen: onOpenCreateModal,
    onClose: onCloseCreateModal
  } = useDisclosure();

  return (
    <PageContainer
      isLoading={myDatasets.length === 0 && isFetchingDatasets}
      insertProps={{
        px: folderDetail ? [4, 6] : [5, '10'],
        bg: 'none',
        border: 'none',
        boxShadow: '0'
      }}
      bg={'myWhite.450'}
    >
      <Flex pt={[4, 6]}>
        <Flex flexGrow={1} flexDirection="column">
          <Flex alignItems={'flex-start'} justifyContent={'space-between'}>
            <ParentPaths
              paths={paths}
              FirstPathDom={
                <Flex flex={1} alignItems={'center'}>
                  <MyIcon color={'primary.10 !important'} mr={2} name={'core/dataset/knowledge'} w={'20px'} h={'20px'} />
                  <Box className="textlg" letterSpacing={1} fontSize={'20px'} fontWeight={'bold'}>
                    {t('core.dataset.My Dataset')}
                  </Box>
                </Flex>
              }
              onClick={(e) => {
                router.push({
                  query: {
                    parentId: e
                  }
                });
              }}
            />
            {isPc && RenderSearchInput}
            {userInfo?.team?.permission.hasWritePer && (
              <Button ml={3} variant={'primary'} px="0" onClick={onOpenCreateModal}>
                <Flex alignItems={'center'} px={'20px'}>
                  <AddIcon mr={2} />
                  <Box>{t('common.Create New')}</Box>
                </Flex>
              </Button>
            )}
          </Flex>
          <Box flexGrow={1}>
            <List />
          </Box>
        </Flex>

        {!!folderDetail && isPc && (
          <Box ml="6">
            <FolderSlideCard
              refreshDeps={[folderDetail._id]}
              name={folderDetail.name}
              intro={folderDetail.intro}
              onEdit={() => {
                setEditedDataset({
                  id: folderDetail._id,
                  name: folderDetail.name,
                  intro: folderDetail.intro
                });
              }}
              onMove={() => setMoveDatasetId(folderDetail._id)}
              deleteTip={t('dataset.deleteFolderTips')}
              onDelete={() =>
                onDelDataset(folderDetail._id).then(() => {
                  router.replace({
                    query: {
                      ...router.query,
                      parentId: folderDetail.parentId
                    }
                  });
                })
              }
              defaultPer={{
                value: folderDetail.defaultPermission,
                defaultValue: DatasetDefaultPermissionVal,
                onChange: (e) => {
                  return putDatasetById({
                    id: folderDetail._id,
                    defaultPermission: e
                  });
                }
              }}
              managePer={{
                permission: folderDetail.permission,
                onGetCollaboratorList: () => getCollaboratorList(folderDetail._id),
                permissionList: DatasetPermissionList,
                onUpdateCollaborators: ({
                  tmbIds,
                  permission
                }: {
                  tmbIds: string[];
                  permission: number;
                }) => {
                  return postUpdateDatasetCollaborators({
                    tmbIds,
                    permission,
                    datasetId: folderDetail._id
                  });
                },
                onDelOneCollaborator: (tmbId: string) =>
                  deleteDatasetCollaborators({
                    datasetId: folderDetail._id,
                    tmbId
                  })
              }}
            />
          </Box>
        )}
      </Flex>

      {!!editFolderData && (
        <EditFolderModal
          onClose={() => setEditFolderData(undefined)}
          onCreate={async ({ name }) => {
            try {
              await postCreateDataset({
                parentId: parentId || undefined,
                name,
                type: DatasetTypeEnum.folder,
                avatar: FolderImgUrl,
                intro: '',
                kb_name: name,
                user_id: userInfo?._id
              });
              //   await createAdDatasets({
              //     parentId: parentId || undefined,
              //     name,
              //     type: DatasetTypeEnum.folder,
              //     avatar: FolderImgUrl,
              //     intro: '',
              //     kb_name: name,
              //     user_id: userInfo?._id
              //   });
              refetchDatasets();
              refetchPaths();
            } catch (error) {
              return Promise.reject(error);
            }
          }}
          onEdit={async ({ name, intro, id }) => {
            try {
              await putDatasetById({
                id,
                name,
                intro
              });
              refetchDatasets();
              refetchPaths();
            } catch (error) {
              return Promise.reject(error);
            }
          }}
        />
      )}
      {isOpenCreateModal && (
        <CreateModal onClose={onCloseCreateModal} parentId={parentId || undefined} />
      )}
    </PageContainer>
  );
};

export async function getServerSideProps(content: any) {
  return {
    props: {
      ...(await serviceSideProps(content, ['dataset']))
    }
  };
}

function DatasetContextWrapper() {
  return (
    <DatasetContextProvider>
      <Dataset />
    </DatasetContextProvider>
  );
}

export default DatasetContextWrapper;
