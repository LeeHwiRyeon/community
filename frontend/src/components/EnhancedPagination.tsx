import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box,
    Button,
    HStack,
    VStack,
    Text,
    Input,
    Select,
    IconButton,
    Tooltip,
    Progress,
    Spinner,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    Badge,
    Divider,
    Flex,
    Spacer,
    useToast,
    Code,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    ModalFooter,
    useDisclosure,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Grid,
    GridItem,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    StatArrow
} from '@chakra-ui/react';
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    ArrowLeftIcon,
    ArrowRightIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    SettingsIcon,
    InfoIcon,
    WarningIcon,
    CheckIcon,
    CloseIcon,
    RepeatIcon,
    DownloadIcon,
    UploadIcon
} from '@chakra-ui/icons';
import { FixedSizeList as List, VariableSizeList as VariableList } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { actionExportManager } from '../utils/actionExport';

export interface PaginationConfig {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
    showPageNumbers?: boolean;
    showPageSizeSelector?: boolean;
    showJumpToPage?: boolean;
    showStats?: boolean;
    enableInfiniteScroll?: boolean;
    enableVirtualScrolling?: boolean;
    enableKeyboardNavigation?: boolean;
    enableAutoScroll?: boolean;
    maxVisiblePages?: number;
    pageSizeOptions?: number[];
    customPageSizes?: boolean;
}

export interface PaginationData<T = any> {
    items: T[];
    totalCount: number;
    hasMore: boolean;
    isLoading: boolean;
    error?: string;
}

export interface PaginationCallbacks {
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
    onLoadMore?: () => void;
    onRefresh?: () => void;
    onExport?: (format: string) => void;
    onSettingsChange?: (config: PaginationConfig) => void;
}

interface EnhancedPaginationProps<T = any> {
    config: PaginationConfig;
    data: PaginationData<T>;
    callbacks: PaginationCallbacks;
    renderItem: (item: T, index: number) => React.ReactNode;
    height?: number;
    itemHeight?: number;
    className?: string;
}

const EnhancedPagination = <T,>({
    config,
    data,
    callbacks,
    renderItem,
    height = 400,
    itemHeight = 60,
    className = ''
}: EnhancedPaginationProps<T>) => {
    const [localConfig, setLocalConfig] = useState<PaginationConfig>(config);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [jumpToPage, setJumpToPage] = useState(config.currentPage);
    const [showSettings, setShowSettings] = useState(false);
    const [keyboardMode, setKeyboardMode] = useState(false);
    const [autoScrollEnabled, setAutoScrollEnabled] = useState(false);
    const [scrollPosition, setScrollPosition] = useState(0);

    const listRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const infiniteLoaderRef = useRef<any>(null);
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();

    // Update local config when prop changes
    useEffect(() => {
        setLocalConfig(config);
        setJumpToPage(config.currentPage);
    }, [config]);

    // Keyboard navigation
    useEffect(() => {
        if (!localConfig.enableKeyboardNavigation) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey || event.metaKey) {
                switch (event.key) {
                    case 'ArrowLeft':
                        event.preventDefault();
                        handlePreviousPage();
                        break;
                    case 'ArrowRight':
                        event.preventDefault();
                        handleNextPage();
                        break;
                    case 'Home':
                        event.preventDefault();
                        handleFirstPage();
                        break;
                    case 'End':
                        event.preventDefault();
                        handleLastPage();
                        break;
                    case 'r':
                        event.preventDefault();
                        handleRefresh();
                        break;
                    case 's':
                        event.preventDefault();
                        setShowSettings(true);
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [localConfig.enableKeyboardNavigation]);

    // Auto-scroll functionality
    useEffect(() => {
        if (!autoScrollEnabled || !localConfig.enableAutoScroll) return;

        const interval = setInterval(() => {
            if (data.hasMore && !data.isLoading) {
                handleLoadMore();
            }
        }, 5000); // Auto-scroll every 5 seconds

        return () => clearInterval(interval);
    }, [autoScrollEnabled, data.hasMore, data.isLoading]);

    const handlePageChange = useCallback((page: number) => {
        if (page < 1 || page > localConfig.totalPages || page === localConfig.currentPage) return;

        callbacks.onPageChange(page);
        setJumpToPage(page);

        // Scroll to top when changing pages
        if (listRef.current) {
            listRef.current.scrollToItem(0, 'start');
        }
    }, [localConfig.totalPages, localConfig.currentPage, callbacks]);

    const handlePageSizeChange = useCallback((pageSize: number) => {
        if (pageSize === localConfig.pageSize) return;

        const newConfig = { ...localConfig, pageSize, currentPage: 1 };
        setLocalConfig(newConfig);
        callbacks.onPageSizeChange(pageSize);
        callbacks.onSettingsChange?.(newConfig);
    }, [localConfig, callbacks]);

    const handleLoadMore = useCallback(async () => {
        if (data.isLoading || !data.hasMore || !callbacks.onLoadMore) return;

        setIsLoadingMore(true);
        try {
            await callbacks.onLoadMore();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load more items',
                status: 'error',
                duration: 2000,
                isClosable: true,
            });
        } finally {
            setIsLoadingMore(false);
        }
    }, [data.isLoading, data.hasMore, callbacks, toast]);

    const handleRefresh = useCallback(() => {
        callbacks.onRefresh?.();
        toast({
            title: 'Refreshed',
            description: 'Data has been refreshed',
            status: 'info',
            duration: 1500,
            isClosable: true,
        });
    }, [callbacks, toast]);

    const handleExport = useCallback(async (format: string) => {
        try {
            const result = await actionExportManager.exportActions({
                format: format as any,
                includeAnalytics: true,
                includeScheduled: true,
                includeTemplates: true
            });

            if (result.success) {
                actionExportManager.downloadFile(result);
                toast({
                    title: 'Export Successful',
                    description: `Data exported as ${format.toUpperCase()}`,
                    status: 'success',
                    duration: 2000,
                    isClosable: true,
                });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast({
                title: 'Export Failed',
                description: error instanceof Error ? error.message : 'Unknown error',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    }, [toast]);

    const handleJumpToPage = useCallback(() => {
        handlePageChange(jumpToPage);
    }, [jumpToPage, handlePageChange]);

    const handlePreviousPage = useCallback(() => {
        handlePageChange(localConfig.currentPage - 1);
    }, [localConfig.currentPage, handlePageChange]);

    const handleNextPage = useCallback(() => {
        handlePageChange(localConfig.currentPage + 1);
    }, [localConfig.currentPage, handlePageChange]);

    const handleFirstPage = useCallback(() => {
        handlePageChange(1);
    }, [handlePageChange]);

    const handleLastPage = useCallback(() => {
        handlePageChange(localConfig.totalPages);
    }, [localConfig.totalPages, handlePageChange]);

    const generatePageNumbers = useCallback(() => {
        const { currentPage, totalPages, maxVisiblePages = 5 } = localConfig;
        const pages: (number | string)[] = [];

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            const half = Math.floor(maxVisiblePages / 2);
            let start = Math.max(1, currentPage - half);
            let end = Math.min(totalPages, start + maxVisiblePages - 1);

            if (end - start + 1 < maxVisiblePages) {
                start = Math.max(1, end - maxVisiblePages + 1);
            }

            if (start > 1) {
                pages.push(1);
                if (start > 2) pages.push('...');
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (end < totalPages) {
                if (end < totalPages - 1) pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    }, [localConfig]);

    const isItemLoaded = useCallback((index: number) => {
        return !!data.items[index];
    }, [data.items]);

    const itemCount = data.hasMore ? data.items.length + 1 : data.items.length;

    const renderVirtualItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
        if (index >= data.items.length) {
            return (
                <div style={style}>
                    <Box p={4} textAlign="center">
                        {data.isLoading ? (
                            <VStack spacing={2}>
                                <Spinner size="sm" />
                                <Text fontSize="sm" color="gray.500">Loading more items...</Text>
                            </VStack>
                        ) : data.hasMore ? (
                            <Button
                                size="sm"
                                onClick={handleLoadMore}
                                isLoading={isLoadingMore}
                                loadingText="Loading..."
                            >
                                Load More
                            </Button>
                        ) : (
                            <Text fontSize="sm" color="gray.500">No more items</Text>
                        )}
                    </Box>
                </div>
            );
        }

        return (
            <div style={style}>
                {renderItem(data.items[index], index)}
            </div>
        );
    }, [data.items, data.isLoading, data.hasMore, handleLoadMore, isLoadingMore, renderItem]);

    const renderPaginationControls = () => (
        <Box className={`enhanced-pagination ${className}`}>
            {/* Stats and Info */}
            {localConfig.showStats && (
                <Flex justify="space-between" align="center" mb={4} p={3} bg="gray.50" borderRadius="md">
                    <VStack align="start" spacing={1}>
                        <Text fontSize="sm" fontWeight="medium">
                            Showing {((localConfig.currentPage - 1) * localConfig.pageSize) + 1} to{' '}
                            {Math.min(localConfig.currentPage * localConfig.pageSize, localConfig.totalItems)} of{' '}
                            {localConfig.totalItems} items
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                            Page {localConfig.currentPage} of {localConfig.totalPages}
                        </Text>
                    </VStack>

                    <HStack spacing={2}>
                        <Badge colorScheme="blue" variant="subtle">
                            {localConfig.pageSize} per page
                        </Badge>
                        {keyboardMode && (
                            <Badge colorScheme="green" variant="subtle">
                                Keyboard Mode
                            </Badge>
                        )}
                        {autoScrollEnabled && (
                            <Badge colorScheme="purple" variant="subtle">
                                Auto-scroll
                            </Badge>
                        )}
                    </HStack>
                </Flex>
            )}

            {/* Error Display */}
            {data.error && (
                <Alert status="error" mb={4}>
                    <AlertIcon />
                    <AlertTitle>Error loading data!</AlertTitle>
                    <AlertDescription>{data.error}</AlertDescription>
                </Alert>
            )}

            {/* Main Content */}
            <Box ref={containerRef} position="relative">
                {localConfig.enableVirtualScrolling ? (
                    <Box border="1px solid" borderColor="gray.200" borderRadius="md" overflow="hidden">
                        {localConfig.enableInfiniteScroll ? (
                            <InfiniteLoader
                                ref={infiniteLoaderRef}
                                isItemLoaded={isItemLoaded}
                                itemCount={itemCount}
                                loadMoreItems={handleLoadMore}
                            >
                                {({ onItemsRendered, ref }) => (
                                    <List
                                        ref={(list) => {
                                            ref(list);
                                            listRef.current = list;
                                        }}
                                        height={height}
                                        itemCount={itemCount}
                                        itemSize={itemHeight}
                                        onItemsRendered={onItemsRendered}
                                        width="100%"
                                    >
                                        {renderVirtualItem}
                                    </List>
                                )}
                            </InfiniteLoader>
                        ) : (
                            <List
                                ref={listRef}
                                height={height}
                                itemCount={data.items.length}
                                itemSize={itemHeight}
                                width="100%"
                            >
                                {renderVirtualItem}
                            </List>
                        )}
                    </Box>
                ) : (
                    <VStack spacing={2} align="stretch" maxHeight={height} overflowY="auto">
                        {data.items.map((item, index) => (
                            <Box key={index}>
                                {renderItem(item, index)}
                            </Box>
                        ))}

                        {localConfig.enableInfiniteScroll && data.hasMore && (
                            <Box p={4} textAlign="center">
                                {data.isLoading ? (
                                    <VStack spacing={2}>
                                        <Spinner size="sm" />
                                        <Text fontSize="sm" color="gray.500">Loading more items...</Text>
                                    </VStack>
                                ) : (
                                    <Button
                                        size="sm"
                                        onClick={handleLoadMore}
                                        isLoading={isLoadingMore}
                                        loadingText="Loading..."
                                    >
                                        Load More
                                    </Button>
                                )}
                            </Box>
                        )}
                    </VStack>
                )}
            </Box>

            {/* Pagination Controls */}
            <Flex justify="space-between" align="center" mt={4} wrap="wrap" gap={2}>
                {/* Page Size Selector */}
                {localConfig.showPageSizeSelector && (
                    <HStack spacing={2}>
                        <Text fontSize="sm" color="gray.600">Items per page:</Text>
                        <Select
                            value={localConfig.pageSize}
                            onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                            size="sm"
                            maxW="100px"
                        >
                            {localConfig.pageSizeOptions?.map(size => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </Select>
                    </HStack>
                )}

                {/* Page Navigation */}
                <HStack spacing={1}>
                    <Tooltip label="First page (Ctrl+Home)">
                        <IconButton
                            aria-label="First page"
                            icon={<ArrowLeftIcon />}
                            size="sm"
                            variant="outline"
                            onClick={handleFirstPage}
                            isDisabled={localConfig.currentPage === 1}
                        />
                    </Tooltip>

                    <Tooltip label="Previous page (Ctrl+←)">
                        <IconButton
                            aria-label="Previous page"
                            icon={<ChevronLeftIcon />}
                            size="sm"
                            variant="outline"
                            onClick={handlePreviousPage}
                            isDisabled={localConfig.currentPage === 1}
                        />
                    </Tooltip>

                    {/* Page Numbers */}
                    {localConfig.showPageNumbers && (
                        <HStack spacing={1}>
                            {generatePageNumbers().map((page, index) => (
                                <Box key={index}>
                                    {page === '...' ? (
                                        <Text px={2} py={1} fontSize="sm" color="gray.500">...</Text>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant={page === localConfig.currentPage ? 'solid' : 'outline'}
                                            colorScheme={page === localConfig.currentPage ? 'blue' : 'gray'}
                                            onClick={() => handlePageChange(page as number)}
                                            minW="40px"
                                        >
                                            {page}
                                        </Button>
                                    )}
                                </Box>
                            ))}
                        </HStack>
                    )}

                    <Tooltip label="Next page (Ctrl+→)">
                        <IconButton
                            aria-label="Next page"
                            icon={<ChevronRightIcon />}
                            size="sm"
                            variant="outline"
                            onClick={handleNextPage}
                            isDisabled={localConfig.currentPage === localConfig.totalPages}
                        />
                    </Tooltip>

                    <Tooltip label="Last page (Ctrl+End)">
                        <IconButton
                            aria-label="Last page"
                            icon={<ArrowRightIcon />}
                            size="sm"
                            variant="outline"
                            onClick={handleLastPage}
                            isDisabled={localConfig.currentPage === localConfig.totalPages}
                        />
                    </Tooltip>
                </HStack>

                {/* Jump to Page */}
                {localConfig.showJumpToPage && (
                    <HStack spacing={2}>
                        <Text fontSize="sm" color="gray.600">Go to:</Text>
                        <NumberInput
                            value={jumpToPage}
                            onChange={(valueString) => setJumpToPage(parseInt(valueString) || 1)}
                            min={1}
                            max={localConfig.totalPages}
                            size="sm"
                            maxW="80px"
                        >
                            <NumberInputField />
                            <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                            </NumberInputStepper>
                        </NumberInput>
                        <Button size="sm" onClick={handleJumpToPage}>
                            Go
                        </Button>
                    </HStack>
                )}

                {/* Action Buttons */}
                <HStack spacing={1}>
                    <Tooltip label="Refresh (Ctrl+R)">
                        <IconButton
                            aria-label="Refresh"
                            icon={<RepeatIcon />}
                            size="sm"
                            variant="outline"
                            onClick={handleRefresh}
                        />
                    </Tooltip>

                    <Tooltip label="Export data">
                        <IconButton
                            aria-label="Export"
                            icon={<DownloadIcon />}
                            size="sm"
                            variant="outline"
                            onClick={onOpen}
                        />
                    </Tooltip>

                    <Tooltip label="Settings (Ctrl+S)">
                        <IconButton
                            aria-label="Settings"
                            icon={<SettingsIcon />}
                            size="sm"
                            variant="outline"
                            onClick={() => setShowSettings(true)}
                        />
                    </Tooltip>
                </HStack>
            </Flex>

            {/* Progress Bar */}
            {data.isLoading && (
                <Progress
                    size="sm"
                    isIndeterminate
                    colorScheme="blue"
                    mt={2}
                />
            )}
        </Box>
    );

    return (
        <>
            {renderPaginationControls()}

            {/* Export Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="md">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Export Data</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <VStack spacing={4} align="stretch">
                            <Text fontSize="sm" color="gray.600">
                                Choose export format and options
                            </Text>

                            <HStack spacing={4} wrap="wrap">
                                <Button
                                    colorScheme="blue"
                                    onClick={() => handleExport('csv')}
                                    leftIcon={<DownloadIcon />}
                                >
                                    CSV
                                </Button>
                                <Button
                                    colorScheme="green"
                                    onClick={() => handleExport('json')}
                                    leftIcon={<DownloadIcon />}
                                >
                                    JSON
                                </Button>
                                <Button
                                    colorScheme="purple"
                                    onClick={() => handleExport('xlsx')}
                                    leftIcon={<DownloadIcon />}
                                >
                                    Excel
                                </Button>
                                <Button
                                    colorScheme="red"
                                    onClick={() => handleExport('pdf')}
                                    leftIcon={<DownloadIcon />}
                                >
                                    PDF
                                </Button>
                            </HStack>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
};

export default EnhancedPagination;
