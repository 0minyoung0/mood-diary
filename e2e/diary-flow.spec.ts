import { test, expect } from "@playwright/test";

// AI 분석에 시간이 걸릴 수 있으므로 타임아웃 연장
test.setTimeout(60000);

test.describe("TC-E2E-001: 일기 작성 및 조회 플로우", () => {
  test("새 일기를 작성하고 조회할 수 있다", async ({ page }) => {
    // 홈페이지로 이동
    await page.goto("/");

    // 페이지 로드 확인
    await expect(page.locator("text=내 일기")).toBeVisible();

    // 새 일기 버튼 클릭
    await page.click("text=새 일기");

    // 작성 페이지로 이동 확인
    await expect(page).toHaveURL(/\/write/);

    // 날짜 선택 (오늘 날짜 사용)
    const today = new Date().toISOString().split("T")[0];
    await page.fill('input[type="date"]', today);

    // 내용 입력
    const content = "오늘은 E2E 테스트를 작성하는 날입니다.";
    await page.fill("textarea", content);

    // AI로 감정 분석하기 버튼 클릭
    await page.click("button:has-text('AI로 감정 분석하기')");

    // confirm 단계로 이동 대기 (AI 분석이 완료되거나 실패해도 이동)
    await expect(page.locator("text=감정 확인")).toBeVisible({ timeout: 30000 });

    // MoodPicker에서 감정 선택 (기쁨)
    await page.click("button:has-text('기쁨')");

    // 저장하기 버튼 클릭
    await page.click("button:has-text('저장하기')");

    // 홈 페이지로 이동 확인
    await expect(page).toHaveURL("/");

    // 작성한 일기가 목록에 표시되는지 확인
    await expect(page.locator(`text=${content.substring(0, 30)}`)).toBeVisible();
  });
});

test.describe("TC-E2E-002: 일기 수정 플로우", () => {
  test.beforeEach(async ({ page }) => {
    // 테스트용 일기 작성
    await page.goto("/write");
    await page.fill('input[type="date"]', "2026-01-15");
    await page.fill("textarea", "수정 전 내용입니다.");
    await page.click("button:has-text('AI로 감정 분석하기')");

    // confirm 단계 대기
    await expect(page.locator("text=감정 확인")).toBeVisible({ timeout: 30000 });

    await page.click("button:has-text('기쁨')");
    await page.click("button:has-text('저장하기')");
    await expect(page).toHaveURL("/");
  });

  test("기존 일기를 수정할 수 있다", async ({ page }) => {
    // 일기 카드 클릭하여 상세 페이지로 이동
    await page.click("text=수정 전 내용입니다.");

    // 상세 페이지 확인
    await expect(page.locator("text=수정 전 내용입니다.")).toBeVisible();

    // 수정 버튼 클릭
    await page.click("a:has-text('수정')");

    // 수정 페이지로 이동 확인
    await expect(page).toHaveURL(/\/edit\//);

    // 일기 수정 페이지 로드 대기 - textarea가 보일 때까지 대기
    await expect(page.locator("textarea")).toBeVisible();

    // 내용 수정
    await page.locator("textarea").fill("수정 후 내용입니다.");

    // 감정 변경 (슬픔) - 클릭 후 대기
    const moodButton = page.locator("button:has-text('슬픔')");
    await moodButton.click();

    // JavaScript로 직접 폼 제출
    await page.evaluate(() => {
      const form = document.querySelector("form");
      if (form) {
        form.requestSubmit();
      }
    });

    // 상세 페이지로 이동 확인
    await expect(page).toHaveURL(/\/entry\//);

    // 수정된 내용 확인
    await expect(page.locator("text=수정 후 내용입니다.")).toBeVisible();
  });
});

test.describe("TC-E2E-003: 일기 삭제 플로우", () => {
  test.beforeEach(async ({ page }) => {
    // 테스트용 일기 작성
    await page.goto("/write");
    await page.fill('input[type="date"]', "2026-01-20");
    await page.fill("textarea", "삭제될 일기입니다.");
    await page.click("button:has-text('AI로 감정 분석하기')");

    // confirm 단계 대기
    await expect(page.locator("text=감정 확인")).toBeVisible({ timeout: 30000 });

    await page.click("button:has-text('평온')");
    await page.click("button:has-text('저장하기')");
    await expect(page).toHaveURL("/");
  });

  test("일기를 삭제할 수 있다", async ({ page }) => {
    // 일기 카드 클릭하여 상세 페이지로 이동
    await page.click("text=삭제될 일기입니다.");

    // 상세 페이지 확인
    await expect(page.locator("text=삭제될 일기입니다.")).toBeVisible();

    // 삭제 버튼 클릭
    await page.click("button:has-text('삭제')");

    // 확인 다이얼로그 표시 확인
    await expect(page.locator("text=일기 삭제")).toBeVisible();
    await expect(page.locator("text=정말 이 일기를 삭제하시겠습니까")).toBeVisible();

    // 삭제 확인 클릭 (다이얼로그 내 삭제 버튼)
    await page.locator("[role='alertdialog'] button:has-text('삭제')").click();

    // 홈 페이지로 이동 확인
    await expect(page).toHaveURL("/");

    // 삭제된 일기가 목록에 없는지 확인
    await expect(page.locator("text=삭제될 일기입니다.")).not.toBeVisible();
  });

  test("삭제 취소 시 일기가 유지된다", async ({ page }) => {
    // 일기 카드 클릭하여 상세 페이지로 이동
    await page.click("text=삭제될 일기입니다.");

    // 삭제 버튼 클릭
    await page.click("button:has-text('삭제')");

    // 취소 버튼 클릭
    await page.click("button:has-text('취소')");

    // 다이얼로그가 닫히고 상세 페이지에 남아있는지 확인
    await expect(page.locator("text=삭제될 일기입니다.")).toBeVisible();
    await expect(page.locator("[role='alertdialog']")).not.toBeVisible();
  });
});

test.describe("TC-E2E-004: 일기 검색 플로우", () => {
  test.beforeEach(async ({ page }) => {
    // 테스트용 일기 2개 작성
    await page.goto("/write");
    await page.fill('input[type="date"]', "2026-01-10");
    await page.fill("textarea", "맛있는 피자를 먹었다");
    await page.click("button:has-text('AI로 감정 분석하기')");
    await expect(page.locator("text=감정 확인")).toBeVisible({ timeout: 30000 });
    await page.click("button:has-text('기쁨')");
    await page.click("button:has-text('저장하기')");
    await expect(page).toHaveURL("/");

    await page.goto("/write");
    await page.fill('input[type="date"]', "2026-01-11");
    await page.fill("textarea", "운동을 열심히 했다");
    await page.click("button:has-text('AI로 감정 분석하기')");
    await expect(page.locator("text=감정 확인")).toBeVisible({ timeout: 30000 });
    await page.click("button:has-text('평온')");
    await page.click("button:has-text('저장하기')");
    await expect(page).toHaveURL("/");
  });

  test("키워드로 일기를 검색할 수 있다", async ({ page }) => {
    // 홈페이지에서 검색
    await page.goto("/");
    await expect(page.locator("text=맛있는 피자")).toBeVisible();
    await expect(page.locator("text=운동을 열심히")).toBeVisible();

    // 검색어 입력
    await page.fill('input[placeholder="일기 내용 검색..."]', "피자");

    // 검색 결과 확인
    await expect(page.locator("text=맛있는 피자")).toBeVisible();
    await expect(page.locator("text=운동을 열심히")).not.toBeVisible();
    await expect(page.locator('text="피자" 검색 결과: 1개')).toBeVisible();
  });

  test("검색 결과가 없으면 안내 메시지가 표시된다", async ({ page }) => {
    await page.goto("/");

    // 존재하지 않는 키워드 검색
    await page.fill('input[placeholder="일기 내용 검색..."]', "존재하지않는키워드");

    // 안내 메시지 확인
    await expect(page.locator("text=검색 결과가 없습니다")).toBeVisible();
  });
});

test.describe("캘린더 및 통계 페이지", () => {
  test("캘린더 페이지에서 월 이동이 가능하다", async ({ page }) => {
    await page.goto("/calendar");

    // 캘린더 페이지 확인
    await expect(page.locator("text=감정 캘린더")).toBeVisible();

    // 현재 월 표시 확인 (동적으로 계산)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    await expect(page.locator(`text=${currentYear}년 ${currentMonth}월`)).toBeVisible();

    // 이전 달 버튼 클릭
    await page.locator("button").first().click();

    // 월 변경 확인
    await expect(page.locator(`text=${prevYear}년 ${prevMonth}월`)).toBeVisible();
  });

  test("통계 페이지에서 감정 통계를 확인할 수 있다", async ({ page }) => {
    // 일기 작성
    await page.goto("/write");
    await page.fill('input[type="date"]', "2026-01-25");
    await page.fill("textarea", "통계 테스트용 일기입니다.");
    await page.click("button:has-text('AI로 감정 분석하기')");

    // confirm 단계 대기
    await expect(page.locator("text=감정 확인")).toBeVisible({ timeout: 30000 });

    await page.click("button:has-text('기쁨')");
    await page.click("button:has-text('저장하기')");

    // 통계 페이지로 이동
    await page.goto("/stats");

    // 통계 페이지 확인
    await expect(page.locator("text=감정 통계")).toBeVisible();
    await expect(page.locator("text=월별 감정 패턴을 확인해보세요")).toBeVisible();
  });
});
