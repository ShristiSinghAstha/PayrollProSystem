import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Card } from 'antd';

const SkeletonTable = ({
    rows = 5,
    columns = 5,
    hasActions = true,
    style = {}
}) => {
    return (
        <Card style={style}>
            {/* Table header skeleton */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: hasActions ? `repeat(${columns}, 1fr) 100px` : `repeat(${columns}, 1fr)`,
                gap: 16,
                padding: '12px 0',
                borderBottom: '1px solid #f0f0f0',
                marginBottom: 12
            }}>
                {Array.from({ length: columns }).map((_, index) => (
                    <Skeleton key={`header-${index}`} height={16} width="80%" />
                ))}
                {hasActions && <Skeleton height={16} width={60} />}
            </div>

            {/* Table rows skeleton */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div
                    key={`row-${rowIndex}`}
                    style={{
                        display: 'grid',
                        gridTemplateColumns: hasActions ? `repeat(${columns}, 1fr) 100px` : `repeat(${columns}, 1fr)`,
                        gap: 16,
                        padding: '16px 0',
                        borderBottom: rowIndex < rows - 1 ? '1px solid #f9f9f9' : 'none'
                    }}
                >
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <Skeleton
                            key={`cell-${rowIndex}-${colIndex}`}
                            height={18}
                            width={colIndex === 0 ? '90%' : '70%'}
                        />
                    ))}
                    {hasActions && (
                        <div style={{ display: 'flex', gap: 8 }}>
                            <Skeleton width={30} height={30} borderRadius={4} />
                            <Skeleton width={30} height={30} borderRadius={4} />
                        </div>
                    )}
                </div>
            ))}
        </Card>
    );
};

export default SkeletonTable;
