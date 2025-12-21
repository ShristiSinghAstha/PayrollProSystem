import React from 'react';
import Lottie from 'lottie-react';
import { Button, Typography } from 'antd';
import { motion } from 'framer-motion';

const { Title, Text } = Typography;

// Simple inline Lottie animation data for empty state
const emptyAnimation = {
    v: "5.7.4",
    fr: 30,
    ip: 0,
    op: 90,
    w: 400,
    h: 400,
    nm: "Empty State",
    ddd: 0,
    assets: [],
    layers: [
        {
            ddd: 0,
            ind: 1,
            ty: 4,
            nm: "Box",
            sr: 1,
            ks: {
                o: { a: 0, k: 100 },
                r: { a: 1, k: [{ t: 0, s: [-10], e: [10] }, { t: 45, s: [10], e: [-10] }, { t: 90, s: [-10] }] },
                p: { a: 0, k: [200, 200, 0] },
                a: { a: 0, k: [0, 0, 0] },
                s: { a: 0, k: [100, 100, 100] }
            },
            shapes: [{
                ty: "gr",
                it: [{
                    ty: "rc",
                    d: 1,
                    s: { a: 0, k: [120, 120] },
                    p: { a: 0, k: [0, 0] },
                    r: { a: 0, k: 8 }
                }, {
                    ty: "fl",
                    c: { a: 0, k: [0.89, 0.89, 0.89, 1] }
                }, {
                    ty: "tr",
                    p: { a: 0, k: [0, 0] },
                    a: { a: 0, k: [0, 0] },
                    s: { a: 0, k: [100, 100] },
                    r: { a: 0, k: 0 },
                    o: { a: 0, k: 100 }
                }]
            }]
        }
    ]
};

const LottieEmptyState = ({
    title = 'No Data Found',
    description = 'There are no items to display at the moment.',
    actionText,
    onAction,
    animation = emptyAnimation,
    height = 250
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
                textAlign: 'center',
            }}
        >
            {/* Lottie Animation */}
            <div style={{ width: height, height: height, marginBottom: 24 }}>
                <Lottie
                    animationData={animation}
                    loop={true}
                    style={{ width: '100%', height: '100%' }}
                />
            </div>

            {/* Title */}
            <Title level={4} style={{ margin: 0, marginBottom: 8, color: '#8c8c8c' }}>
                {title}
            </Title>

            {/* Description */}
            <Text type="secondary" style={{ fontSize: 14, marginBottom: 24, maxWidth: 400 }}>
                {description}
            </Text>

            {/* Optional Action Button */}
            {actionText && onAction && (
                <Button type="primary" size="large" onClick={onAction}>
                    {actionText}
                </Button>
            )}
        </motion.div>
    );
};

export default LottieEmptyState;
