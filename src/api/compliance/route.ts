import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Định nghĩa interface cho dữ liệu đầu vào
interface RequestBody {
  address: string;
}

// Định nghĩa interface cho phản hồi lỗi
interface ErrorResponse {
  error: string;
}

// Định nghĩa interface cho phản hồi thành công
interface SuccessResponse {
  success: boolean;
  isApproved: boolean;
  data?: any; // Dữ liệu từ Circle API, có thể tinh chỉnh nếu bạn biết cấu trúc cụ thể
  message?: string;
  result?: string;
  
}

export async function POST(request: Request) {
  try {
    // Lấy dữ liệu từ request body
    const { address } = (await request.json()) as RequestBody;

    // Kiểm tra address
    if (!address) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    // Tạo idempotency key
    const idempotencyKey: string = uuidv4();
    const chain = 'ETH-SEPOLIA';

    // Lấy Circle API key từ environment
    const circleApiKey = process.env.CIRCLE_API_KEY;
    if (!circleApiKey) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Kiểm tra biến môi trường ENABLE_COMPILE_CHECK
    const complianceEnabled = process.env.ENABLE_COMPILE_CHECK === 'true';

    if (!complianceEnabled) {
      console.log('Compliance check is disabled');
      return NextResponse.json<SuccessResponse>({
          isApproved: true,
          result: 'APPROVED',
          message: 'Compliance check is disabled',
          success: false
      });
    }

    // Gửi yêu cầu đến Circle API
    const circleResponse = await fetch(
      'https://api.circle.com/v1/w3s/compliance/screening/addresses',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${circleApiKey}`,
        },
        body: JSON.stringify({
          idempotencyKey,
          chain,
          address,
        }),
      }
    );

    // Kiểm tra phản hồi từ Circle API
    if (!circleResponse.ok) {
      throw new Error(`Circle API error: ${circleResponse.statusText}`);
    }

    const data = await circleResponse.json();

    // Kiểm tra kết quả từ Circle API
    const isApproved = data?.result === 'APPROVED';

    return NextResponse.json<SuccessResponse>({
      success: true,
      isApproved,
      data: data?.data,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}