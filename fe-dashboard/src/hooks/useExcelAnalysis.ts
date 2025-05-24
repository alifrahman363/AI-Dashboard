import { useRef, useState } from 'react';
import { ExcelService } from '../components/services/excelService';
import { Message } from '../types';

export interface UseExcelAnalysisReturn {
    selectedFile: File | null;
    setSelectedFile: (file: File | null) => void;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    triggerFileInput: () => void;
    submitExcelAnalysis: (prompt: string, onSuccess: (message: Message) => void, onError: (error: string) => void) => Promise<void>;
    fileInputRef: React.RefObject<HTMLInputElement>;
    isValidFile: (file: File) => boolean;
    clearFile: () => void;
}

export const useExcelAnalysis = (): UseExcelAnalysisReturn => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const excelService = new ExcelService();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log('handleFileChange triggered');
        const file = e.target.files?.[0];

        if (file) {
            const validation = excelService.validateExcelFile(file);

            if (validation.isValid) {
                console.log('Valid Excel file selected:', file.name);
                setSelectedFile(file);
            } else {
                console.log('Invalid file selected:', file.name);
                setSelectedFile(null);
                clearFile();
                throw new Error(validation.error || 'Invalid file');
            }
        }
    };

    const triggerFileInput = () => {
        console.log('triggerFileInput called');
        if (fileInputRef.current) {
            console.log('fileInputRef exists, triggering click');
            fileInputRef.current.click();
        } else {
            console.error('fileInputRef is null');
            throw new Error('File input not found. Please try again.');
        }
    };

    const submitExcelAnalysis = async (
        prompt: string,
        onSuccess: (message: Message) => void,
        onError: (error: string) => void
    ): Promise<void> => {
        if (!selectedFile) {
            onError('No file selected');
            return;
        }

        try {
            console.log('Submitting Excel upload with prompt:', prompt, 'and file:', selectedFile.name);

            const excelResult = await excelService.analyzeExcelFile(selectedFile, prompt);
            const processedResult = excelService.processExcelAnalysis(excelResult);

            const aiMessage: Message = {
                id: `ai-${Date.now()}`,
                type: 'ai',
                content: {
                    ...excelResult,
                    chartData: processedResult.chartData,
                    summary: processedResult.summary
                },
                timestamp: new Date(),
            };

            onSuccess(aiMessage);
            clearFile();
        } catch (error: any) {
            onError(error.message);
        }
    };

    const isValidFile = (file: File): boolean => {
        return excelService.validateExcelFile(file).isValid;
    };

    const clearFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return {
        selectedFile,
        setSelectedFile,
        handleFileChange,
        triggerFileInput,
        submitExcelAnalysis,
        fileInputRef,
        isValidFile,
        clearFile,
    };
};