import React, { useState } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Switch,
    FormControl,
    FormLabel,
    FormHelperText,
    Button,
    Divider,
    Heading,
    Slider,
    SliderTrack,
    SliderFilledTrack,
    SliderThumb,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    useToast
} from '@chakra-ui/react';
import { useHighContrast } from '../../contexts/HighContrastContext';
import { useScreenReader } from '../../hooks/useScreenReader';

const AccessibilitySettings: React.FC = () => {
    const { isHighContrast, toggleHighContrast } = useHighContrast();
    const { announce } = useScreenReader();
    const toast = useToast();

    const [fontSize, setFontSize] = useState(16);
    const [lineHeight, setLineHeight] = useState(1.5);
    const [letterSpacing, setLetterSpacing] = useState(0);
    const [wordSpacing, setWordSpacing] = useState(0);
    const [reduceMotion, setReduceMotion] = useState(false);
    const [focusVisible, setFocusVisible] = useState(true);
    const [announceChanges, setAnnounceChanges] = useState(true);

    const applySettings = () => {
        const root = document.documentElement;

        // 폰트 크기 설정
        root.style.setProperty('--accessibility-font-size', `${fontSize}px`);

        // 줄 간격 설정
        root.style.setProperty('--accessibility-line-height', lineHeight.toString());

        // 글자 간격 설정
        root.style.setProperty('--accessibility-letter-spacing', `${letterSpacing}px`);

        // 단어 간격 설정
        root.style.setProperty('--accessibility-word-spacing', `${wordSpacing}px`);

        // 애니메이션 감소 설정
        if (reduceMotion) {
            root.style.setProperty('--accessibility-reduce-motion', 'reduce');
            document.body.classList.add('reduce-motion');
        } else {
            root.style.removeProperty('--accessibility-reduce-motion');
            document.body.classList.remove('reduce-motion');
        }

        // 포커스 표시 설정
        if (focusVisible) {
            root.style.setProperty('--accessibility-focus-visible', 'auto');
        } else {
            root.style.setProperty('--accessibility-focus-visible', 'none');
        }

        toast({
            title: '접근성 설정이 적용되었습니다.',
            status: 'success',
            duration: 3000,
            isClosable: true,
        });

        if (announceChanges) {
            announce('접근성 설정이 적용되었습니다.');
        }
    };

    const resetSettings = () => {
        setFontSize(16);
        setLineHeight(1.5);
        setLetterSpacing(0);
        setWordSpacing(0);
        setReduceMotion(false);
        setFocusVisible(true);

        const root = document.documentElement;
        root.style.removeProperty('--accessibility-font-size');
        root.style.removeProperty('--accessibility-line-height');
        root.style.removeProperty('--accessibility-letter-spacing');
        root.style.removeProperty('--accessibility-word-spacing');
        root.style.removeProperty('--accessibility-reduce-motion');
        root.style.removeProperty('--accessibility-focus-visible');

        document.body.classList.remove('reduce-motion');

        toast({
            title: '설정이 초기화되었습니다.',
            status: 'info',
            duration: 3000,
            isClosable: true,
        });
    };

    return (
        <Box p={6} maxW="800px" mx="auto">
            <VStack spacing={6} align="stretch">
                <Box>
                    <Heading as="h1" size="xl" mb={2}>
                        접근성 설정
                    </Heading>
                    <Text color="gray.600">
                        시각, 청각, 운동 기능에 따라 웹사이트를 더 쉽게 사용할 수 있도록 설정을 조정하세요.
                    </Text>
                </Box>

                <VStack spacing={6} align="stretch">
                    {/* 고대비 모드 */}
                    <FormControl>
                        <HStack justify="space-between">
                            <Box>
                                <FormLabel mb={1}>고대비 모드</FormLabel>
                                <FormHelperText>
                                    색상 대비를 높여 텍스트를 더 명확하게 보이게 합니다.
                                </FormHelperText>
                            </Box>
                            <Switch
                                isChecked={isHighContrast}
                                onChange={toggleHighContrast}
                                size="lg"
                            />
                        </HStack>
                    </FormControl>

                    <Divider />

                    {/* 텍스트 크기 */}
                    <FormControl>
                        <FormLabel mb={2}>텍스트 크기</FormLabel>
                        <HStack spacing={4}>
                            <Slider
                                value={fontSize}
                                onChange={setFontSize}
                                min={12}
                                max={24}
                                step={1}
                                flex={1}
                            >
                                <SliderTrack>
                                    <SliderFilledTrack />
                                </SliderTrack>
                                <SliderThumb />
                            </Slider>
                            <NumberInput
                                value={fontSize}
                                onChange={(_, value) => setFontSize(value || 16)}
                                min={12}
                                max={24}
                                w="80px"
                            >
                                <NumberInputField />
                                <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                </NumberInputStepper>
                            </NumberInput>
                        </HStack>
                        <FormHelperText>
                            현재 크기: {fontSize}px
                        </FormHelperText>
                    </FormControl>

                    {/* 줄 간격 */}
                    <FormControl>
                        <FormLabel mb={2}>줄 간격</FormLabel>
                        <HStack spacing={4}>
                            <Slider
                                value={lineHeight}
                                onChange={setLineHeight}
                                min={1.2}
                                max={2.0}
                                step={0.1}
                                flex={1}
                            >
                                <SliderTrack>
                                    <SliderFilledTrack />
                                </SliderTrack>
                                <SliderThumb />
                            </Slider>
                            <NumberInput
                                value={lineHeight}
                                onChange={(_, value) => setLineHeight(value || 1.5)}
                                min={1.2}
                                max={2.0}
                                step={0.1}
                                w="80px"
                            >
                                <NumberInputField />
                                <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                </NumberInputStepper>
                            </NumberInput>
                        </HStack>
                        <FormHelperText>
                            현재 간격: {lineHeight}
                        </FormHelperText>
                    </FormControl>

                    {/* 글자 간격 */}
                    <FormControl>
                        <FormLabel mb={2}>글자 간격</FormLabel>
                        <HStack spacing={4}>
                            <Slider
                                value={letterSpacing}
                                onChange={setLetterSpacing}
                                min={0}
                                max={2}
                                step={0.1}
                                flex={1}
                            >
                                <SliderTrack>
                                    <SliderFilledTrack />
                                </SliderTrack>
                                <SliderThumb />
                            </Slider>
                            <NumberInput
                                value={letterSpacing}
                                onChange={(_, value) => setLetterSpacing(value || 0)}
                                min={0}
                                max={2}
                                step={0.1}
                                w="80px"
                            >
                                <NumberInputField />
                                <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                </NumberInputStepper>
                            </NumberInput>
                        </HStack>
                        <FormHelperText>
                            현재 간격: {letterSpacing}px
                        </FormHelperText>
                    </FormControl>

                    <Divider />

                    {/* 애니메이션 감소 */}
                    <FormControl>
                        <HStack justify="space-between">
                            <Box>
                                <FormLabel mb={1}>애니메이션 감소</FormLabel>
                                <FormHelperText>
                                    움직임에 민감한 사용자를 위해 애니메이션을 줄입니다.
                                </FormHelperText>
                            </Box>
                            <Switch
                                isChecked={reduceMotion}
                                onChange={(e) => setReduceMotion(e.target.checked)}
                                size="lg"
                            />
                        </HStack>
                    </FormControl>

                    {/* 포커스 표시 */}
                    <FormControl>
                        <HStack justify="space-between">
                            <Box>
                                <FormLabel mb={1}>포커스 표시 강화</FormLabel>
                                <FormHelperText>
                                    키보드 네비게이션 시 포커스 표시를 더 명확하게 합니다.
                                </FormHelperText>
                            </Box>
                            <Switch
                                isChecked={focusVisible}
                                onChange={(e) => setFocusVisible(e.target.checked)}
                                size="lg"
                            />
                        </HStack>
                    </FormControl>

                    {/* 변경사항 알림 */}
                    <FormControl>
                        <HStack justify="space-between">
                            <Box>
                                <FormLabel mb={1}>변경사항 알림</FormLabel>
                                <FormHelperText>
                                    스크린 리더 사용자를 위해 설정 변경을 알립니다.
                                </FormHelperText>
                            </Box>
                            <Switch
                                isChecked={announceChanges}
                                onChange={(e) => setAnnounceChanges(e.target.checked)}
                                size="lg"
                            />
                        </HStack>
                    </FormControl>

                    <Divider />

                    {/* 액션 버튼 */}
                    <HStack spacing={4} justify="center">
                        <Button colorScheme="blue" onClick={applySettings}>
                            설정 적용
                        </Button>
                        <Button variant="outline" onClick={resetSettings}>
                            초기화
                        </Button>
                    </HStack>
                </VStack>
            </VStack>
        </Box>
    );
};

export default AccessibilitySettings;
