import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Card } from 'antd';

const SkeletonCard = ({
    rows = 3,
    hasTitle = true,
    hasAvatar = false,
    height = 20,
    style = {}
}) => {
    return (
        <Card style={style}>
            <div style={{ padding: '4px 0' }}>
                {/* Title skeleton */}
                {hasTitle && (
                    <div style={{ marginBottom: 16 }}>
                        <Skeleton width="40%" height={24} />
                    </div>
                )}

                {/* Avatar + content */}
                {hasAvatar && (
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                        <Skeleton circle width={40} height={40} style={{ marginRight: 12 }} />
                        <div style={{ flex: 1 }}>
                            <Skeleton width="60%" height={16} style={{ marginBottom: 8 }} />
                            <Skeleton width="40%" height={14} />
                        </div>
                    </div>
                )}

                {/* Content rows */}
                <div>
                    {Array.from({ length: rows }).map((_, index) => (
                        <div key={index} style={{ marginBottom: index < rows - 1 ? 12 : 0 }}>
                            <Skeleton
                                height={height}
                                width={index % 2 === 0 ? '100%' : '85%'}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
};

export default SkeletonCard;
