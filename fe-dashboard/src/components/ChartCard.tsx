'use client';

import { useState, useRef, useEffect } from 'react';
import type { ChartData as ChartJsData } from 'chart.js';
import dynamic from 'next/dynamic';
import type { ChartProps } from 'react-chartjs-2';
import { FiBookmark, FiMaximize2, FiMinimize2, FiInfo, FiX, FiDownload } from 'react-icons/fi';
import { gsap } from 'gsap'; // Import GSAP
import { ChartData } from '../types';
import { barOptions, doughnutOptions, generateChartData, lineOptions, pieOptions } from '../utils/chartUtils';
import axios from 'axios';

// Define types for each chart component
type PieComponent = React.ComponentType<ChartProps<'pie'>>;
type BarComponent = React.ComponentType<ChartProps<'bar'>>;
type LineComponent = React.ComponentType<ChartProps<'line'>>;
type DoughnutComponent = React.ComponentType<ChartProps<'doughnut'>>;

// Dynamically import each chart component with proper types
const Pie = dynamic(() => import('react-chartjs-2').then((mod) => mod.Pie as PieComponent), { ssr: false });
const Bar = dynamic(() => import('react-chartjs-2').then((mod) => mod.Bar as BarComponent), { ssr: false });
const Line = dynamic(() => import('react-chartjs-2').then((mod) => mod.Line as LineComponent), { ssr: false });
const Doughnut = dynamic(() => import('react-chartjs-2').then((mod) => mod.Doughnut as DoughnutComponent), { ssr: false });

interface ChartCardProps {
    chartData: ChartData;
    onPin: (chartData: ChartData) => void;
    onUnpin: (pinnedChartId: number) => void;
}

export default function ChartCard({ chartData, onPin, onUnpin }: ChartCardProps) {
    const [expanded, setExpanded] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [showDownloadOptions, setShowDownloadOptions] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null); // Ref for the card
    const modalRef = useRef<HTMLDivElement>(null); // Ref for the modal
    const headerRef = useRef<HTMLDivElement>(null); // Ref for card/modal header
    const chartContainerRef = useRef<HTMLDivElement>(null); // Ref for chart container
    const detailsRef = useRef<HTMLDivElement>(null); // Ref for details section
    const downloadOptionsRef = useRef<HTMLDivElement>(null); // Ref for download options dropdown

    const data: ChartJsData<'pie' | 'bar' | 'line' | 'doughnut', number[], string> | null = generateChartData(chartData);
    if (!data) return null;

    const isPinned = !!chartData.pinnedChartId;

    // GSAP animations on mount
    useEffect(() => {
        const ctx = gsap.context(() => {
            // Animate card: Fade in and slide up
            if (cardRef.current) {
                gsap.fromTo(
                    cardRef.current,
                    { opacity: 0, y: 20 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.6,
                        ease: 'power3.out',
                    }
                );
            }

            // Animate header: Fade in title and buttons
            if (headerRef.current) {
                const title = headerRef.current.querySelector('h3');
                const buttons = headerRef.current.querySelectorAll('button');
                if (title) {
                    gsap.fromTo(
                        title,
                        { opacity: 0, x: -10 },
                        {
                            opacity: 1,
                            x: 0,
                            duration: 0.4,
                            ease: 'power3.out',
                            delay: 0.2,
                        }
                    );
                }
                gsap.fromTo(
                    buttons,
                    { opacity: 0, scale: 0.8 },
                    {
                        opacity: 1,
                        scale: 1,
                        duration: 0.4,
                        ease: 'power3.out',
                        stagger: 0.1,
                        delay: 0.3,
                    }
                );
            }

            // Animate chart: Scale and fade in
            if (chartContainerRef.current) {
                gsap.fromTo(
                    chartContainerRef.current,
                    { opacity: 0, scale: 0.95 },
                    {
                        opacity: 1,
                        scale: 1,
                        duration: 0.5,
                        ease: 'power3.out',
                        delay: 0.4,
                    }
                );
            }
        });

        return () => ctx.revert(); // Cleanup animations on unmount
    }, []);

    // Animate details section when toggled
    useEffect(() => {
        if (detailsRef.current) {
            gsap.to(detailsRef.current, {
                opacity: showDetails ? 1 : 0,
                height: showDetails ? 'auto' : 0,
                duration: 0.3,
                ease: 'power3.out',
                onComplete: () => {
                    if (!showDetails) detailsRef.current!.style.display = 'none';
                },
                onStart: () => {
                    if (showDetails) detailsRef.current!.style.display = 'block';
                },
            });
        }
    }, [showDetails]);

    // Animate modal when expanded
    useEffect(() => {
        if (modalRef.current && expanded) {
            const ctx = gsap.context(() => {
                if (modalRef.current) {
                    gsap.fromTo(
                        modalRef.current.querySelector('.bg-gray-800'),
                        { opacity: 0, scale: 0.9 },
                        {
                            opacity: 1,
                            scale: 1,
                            duration: 0.4,
                            ease: 'power3.out',
                        }
                    );
                }
                // Animate modal header
                if (headerRef.current) {
                    const title = headerRef.current.querySelector('h3');
                    const buttons = headerRef.current.querySelectorAll('button');
                    if (title) {
                        gsap.fromTo(
                            title,
                            { opacity: 0, x: -10 },
                            {
                                opacity: 1,
                                x: 0,
                                duration: 0.4,
                                ease: 'power3.out',
                                delay: 0.2,
                            }
                        );
                    }
                    gsap.fromTo(
                        buttons,
                        { opacity: 0, scale: 0.8 },
                        {
                            opacity: 1,
                            scale: 1,
                            duration: 0.4,
                            ease: 'power3.out',
                            stagger: 0.1,
                            delay: 0.3,
                        }
                    );
                }
                // Animate modal chart
                if (chartContainerRef.current) {
                    gsap.fromTo(
                        chartContainerRef.current,
                        { opacity: 0, scale: 0.95 },
                        {
                            opacity: 1,
                            scale: 1,
                            duration: 0.5,
                            ease: 'power3.out',
                            delay: 0.4,
                        }
                    );
                }
            });
            return () => ctx.revert();
        }
    }, [expanded]);

    // Animate download options dropdown
    useEffect(() => {
        if (downloadOptionsRef.current) {
            gsap.to(downloadOptionsRef.current, {
                opacity: showDownloadOptions ? 1 : 0,
                y: showDownloadOptions ? 0 : 10,
                duration: 0.2,
                ease: 'power3.out',
                onComplete: () => {
                    if (!showDownloadOptions) downloadOptionsRef.current!.style.display = 'none';
                },
                onStart: () => {
                    if (showDownloadOptions) downloadOptionsRef.current!.style.display = 'block';
                },
            });
        }
    }, [showDownloadOptions]);

    // Animate downloading indicator
    useEffect(() => {
        if (downloading && headerRef.current) {
            const ping = headerRef.current.querySelector('.animate-ping') as HTMLElement | null;
            if (ping) {
                gsap.to(ping, {
                    scale: 1.5,
                    opacity: 0.5,
                    duration: 0.6,
                    repeat: -1,
                    yoyo: true,
                    ease: 'power1.inOut',
                });
            }
        }
    }, [downloading]);

    const handlePinToggle = () => {
        if (isPinned) {
            onUnpin(chartData.pinnedChartId!);
        } else {
            onPin(chartData);
        }
    };

    const handleDownload = async (format: 'png' | 'pdf' = 'png') => {
        try {
            setDownloading(true);
            const response = await axios.post(
                'http://localhost:3000/deepseek/download-chart',
                {
                    ...chartData,
                    format,
                },
                {
                    responseType: 'blob',
                }
            );

            const blob = new Blob([response.data], {
                type: format === 'png' ? 'image/png' : 'application/pdf',
            });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `chart-${Date.now()}.${format}`);
            document.body.appendChild(link);
            link.click();

            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading chart:', error);
            alert('Failed to download chart. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    // Close modal when clicking outside
    const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
        if (modalRef.current === e.target) {
            gsap.to(modalRef.current.querySelector('.bg-gray-800'), {
                opacity: 0,
                scale: 0.9,
                duration: 0.3,
                ease: 'power3.in',
                onComplete: () => setExpanded(false),
            });
        }
    };

    // Custom options to enforce fixed height and disable dynamic resizing
    const getChartOptions = (chartType: string, isExpanded: boolean) => {
        const baseOptions = {
            responsive: true,
            maintainAspectRatio: false,
            height: isExpanded ? 500 : 250,
            plugins: {
                legend: {
                    position: 'bottom' as const,
                    labels: {
                        color: '#f3f4f6',
                        padding: 20,
                        font: {
                            size: isExpanded ? 14 : 11,
                        },
                    },
                },
                tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    titleColor: '#f3f4f6',
                    bodyColor: '#e5e7eb',
                    padding: 12,
                    borderColor: 'rgba(75, 85, 99, 0.3)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                },
            },
        };

        switch (chartType) {
            case 'pie':
                return { ...pieOptions, ...baseOptions };
            case 'bar':
                return { ...barOptions, ...baseOptions };
            case 'line':
                return { ...lineOptions, ...baseOptions };
            case 'doughnut':
                return { ...doughnutOptions, ...baseOptions };
            default:
                return baseOptions;
        }
    };

    if (expanded) {
        return (
            <div
                ref={modalRef}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 gsap-animated"
                onClick={handleClickOutside}
            >
                <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-hidden gsap-animated">
                    {/* Header */}
                    <div ref={headerRef} className="flex items-center justify-between p-4 border-b border-gray-700">
                        <h3 className="text-lg font-medium text-white">
                            {chartData.title || 'Generated Chart'}
                        </h3>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePinToggle}
                                className={`p-2 rounded-lg transition-colors ${isPinned ? 'text-blue-400 bg-blue-500/10' : 'text-gray-400 hover:text-blue-400 hover:bg-blue-500/10'
                                    }`}
                                title={isPinned ? 'Unpin chart' : 'Pin chart'}
                            >
                                <FiBookmark size={18} />
                            </button>
                            <div className="relative">
                                <button
                                    onClick={() => setShowDownloadOptions(!showDownloadOptions)}
                                    className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                    title="Download chart"
                                    disabled={downloading}
                                >
                                    <FiDownload size={18} />
                                    {downloading && (
                                        <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
                                    )}
                                </button>
                                {showDownloadOptions && (
                                    <div
                                        ref={downloadOptionsRef}
                                        className="absolute right-0 mt-2 w-32 bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden z-10 gsap-animated"
                                    >
                                        <button
                                            onClick={() => {
                                                handleDownload('png');
                                                setShowDownloadOptions(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                                        >
                                            PNG Image
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleDownload('pdf');
                                                setShowDownloadOptions(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                                        >
                                            PDF Document
                                        </button>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => setExpanded(false)}
                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Close expanded view"
                            >
                                <FiX size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Chart Container */}
                    <div ref={chartContainerRef} className="p-4 h-[500px]">
                        {chartData.chartType === 'pie' && (
                            <Pie
                                type="pie"
                                data={data as ChartJsData<'pie', number[], string>}
                                options={getChartOptions('pie', true)}
                            />
                        )}
                        {chartData.chartType === 'bar' && (
                            <Bar
                                type="bar"
                                data={data as ChartJsData<'bar', number[], string>}
                                options={getChartOptions('bar', true)}
                            />
                        )}
                        {chartData.chartType === 'line' && (
                            <Line
                                type="line"
                                data={data as ChartJsData<'line', number[], string>}
                                options={getChartOptions('line', true)}
                            />
                        )}
                        {chartData.chartType === 'doughnut' && (
                            <Doughnut
                                type="doughnut"
                                data={data as ChartJsData<'doughnut', number[], string>}
                                options={getChartOptions('doughnut', true)}
                            />
                        )}
                    </div>

                    {/* Footer with details */}
                    <div ref={detailsRef} className="p-4 border-t border-gray-700 bg-gray-900/50">
                        <div className="space-y-3">
                            <div>
                                <h4 className="text-sm font-medium text-gray-400">Prompt</h4>
                                <p className="text-gray-300">{chartData.prompt}</p>
                            </div>
                            {chartData.query && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-400">SQL Query</h4>
                                    <pre className="bg-gray-900 p-3 rounded-lg text-gray-300 text-sm overflow-x-auto">
                                        {chartData.query}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={cardRef}
            className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden hover:border-gray-600 transition-all duration-300 h-[380px] flex flex-col gsap-animated"
        >
            {/* Header Section */}
            <div ref={headerRef} className="flex justify-between items-center px-4 py-3 border-b border-gray-700">
                <h3 className="font-medium text-gray-200 truncate">
                    {chartData.title || 'Generated Chart'}
                </h3>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="View details"
                    >
                        <FiInfo size={16} />
                    </button>
                    <button
                        onClick={handlePinToggle}
                        className={`p-1.5 rounded-lg transition-colors ${isPinned ? 'text-blue-400 bg-blue-500/10' : 'text-gray-400 hover:text-blue-400 hover:bg-blue-500/10'
                            }`}
                        title={isPinned ? 'Unpin chart' : 'Pin chart'}
                    >
                        <FiBookmark size={16} />
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => handleDownload('png')}
                            className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Download chart as PNG"
                            disabled={downloading}
                        >
                            <FiDownload size={16} />
                            {downloading && (
                                <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
                            )}
                        </button>
                    </div>
                    <button
                        onClick={() => setExpanded(true)}
                        className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="Expand chart"
                    >
                        <FiMaximize2 size={16} />
                    </button>
                </div>
            </div>

            {/* Chart Section */}
            <div ref={chartContainerRef} className="flex-1 p-4 bg-gray-800/50 gsap-animated">
                {chartData.chartType === 'pie' && (
                    <Pie
                        type="pie"
                        data={data as ChartJsData<'pie', number[], string>}
                        options={getChartOptions('pie', false)}
                    />
                )}
                {chartData.chartType === 'bar' && (
                    <Bar
                        type="bar"
                        data={data as ChartJsData<'bar', number[], string>}
                        options={getChartOptions('bar', false)}
                    />
                )}
                {chartData.chartType === 'line' && (
                    <Line
                        type="line"
                        data={data as ChartJsData<'line', number[], string>}
                        options={getChartOptions('line', false)}
                    />
                )}
                {chartData.chartType === 'doughnut' && (
                    <Doughnut
                        type="doughnut"
                        data={data as ChartJsData<'doughnut', number[], string>}
                        options={getChartOptions('doughnut', false)}
                    />
                )}
            </div>

            {/* Footer with prompt info */}
            <div ref={detailsRef} className="px-4 py-3 border-t border-gray-700" style={{ display: showDetails ? 'block' : 'none' }}>
                {showDetails ? (
                    <div className="space-y-2">
                        <div>
                            <h4 className="text-xs font-medium text-gray-400">Prompt</h4>
                            <p className="text-sm text-gray-300">{chartData.prompt}</p>
                        </div>
                        {chartData.query && (
                            <div>
                                <h4 className="text-xs font-medium text-gray-400">SQL Query</h4>
                                <pre className="bg-gray-900/70 p-2 rounded text-gray-300 text-xs overflow-x-auto">
                                    {chartData.query}
                                </pre>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-xs text-gray-400 truncate">{chartData.prompt}</p>
                )}
            </div>
        </div>
    );
}