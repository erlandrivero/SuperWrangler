# Quick Start: Testing Quick ML

## 🚀 5-Minute Test

### Step 1: Start the App (30 seconds)
```bash
cd wine-wrangler
npm run dev
```
Open browser to: `http://localhost:5173`

### Step 2: Load Data (1 minute)
1. In the "📥 Data Import" section
2. Select "OpenML Dataset"
3. Enter Dataset ID: `40691` (wine quality dataset)
4. Click "Load from OpenML"
5. Wait for cleaning to complete (~5 seconds)

### Step 3: Train ML Models (2 minutes)
1. Scroll down to "🤖 Machine Learning" section
2. You should see the **ML Mode Selector** with two cards
3. Click **"Start Quick ML"** button (green card)
4. Watch the progress bar as 7 algorithms train
5. Wait for training to complete (~5-10 seconds)

### Step 4: Review Results (1 minute)
You should now see:
- ✅ **Summary stats** at the top (Total Time, Success Count, Best Model)
- ✅ **Best Model Card** (green gradient background with 🏆)
- ✅ **Comparison Table** (all 7 algorithms with metrics)
- ✅ **Confusion Matrix** (color-coded grid)
- ✅ **Feature Importance** (horizontal bar chart)

### Step 5: Test Interactions (30 seconds)
1. Click column headers in the table to **sort**
2. Click **"🔄 Train New Model"** to reset
3. Train again to verify consistency

---

## ✅ Success Checklist

After completing the 5-minute test, verify:

- [ ] All 7 algorithms show ✓ (success) status
- [ ] Best model is highlighted with 🏆
- [ ] F1 scores are reasonable (> 50%)
- [ ] Confusion matrix displays correctly
- [ ] Feature importance chart shows bars
- [ ] Sorting works in results table
- [ ] No errors in browser console (F12)
- [ ] Training completes in < 15 seconds

---

## 🐛 Common Issues

### Issue: ML section doesn't appear
**Solution**: Make sure data is loaded and cleaned first

### Issue: Training fails with error
**Solution**: Check that dataset has a numeric target column

### Issue: All algorithms show 0% accuracy
**Solution**: Dataset might not be suitable for classification

### Issue: Training takes too long
**Solution**: Dataset might be too large (> 5000 rows)

---

## 📊 Expected Results (Wine Dataset)

### Algorithm Performance:
- **Random Forest**: ~70% F1 (typically best)
- **Decision Tree**: ~60% F1
- **K-Nearest Neighbors**: ~65% F1
- **Naive Bayes**: ~55% F1
- **Logistic Regression**: ~60% F1
- **Support Vector Machine**: ~65% F1
- **Neural Network**: ~60% F1

### Training Time:
- **Total**: 3-8 seconds
- **Per Algorithm**: 100ms - 2000ms

### Confusion Matrix:
- Should be 2×2 (binary classification)
- Diagonal values should be higher (correct predictions)

---

## 🎯 What to Look For

### Good Signs ✅
- All algorithms complete successfully
- Best model F1 > 60%
- Training time < 10 seconds
- Confusion matrix diagonal is strong
- Feature importance shows variation
- UI is responsive and smooth

### Red Flags 🚩
- Multiple algorithms fail
- All F1 scores < 40%
- Training takes > 30 seconds
- Confusion matrix is all zeros
- Console shows errors
- UI freezes or crashes

---

## 📝 Quick Test Report

**Date**: _______________  
**Time**: _______________  
**Browser**: _______________

### Results:
- Training Time: _______ seconds
- Best Algorithm: _______________
- Best F1 Score: _______%
- Successful Algorithms: ___ / 7
- Failed Algorithms: ___ / 7

### Status:
- [ ] ✅ PASS - Everything works perfectly
- [ ] ⚠️ PARTIAL - Works but has minor issues
- [ ] ❌ FAIL - Major problems found

### Notes:
_________________________________
_________________________________
_________________________________

---

## 🔄 Next Steps

### If Test Passes:
1. ✅ Mark Quick ML as complete
2. 📝 Update README with ML features
3. 🎉 Celebrate! You have a working ML system
4. 🚀 Consider deploying to Netlify
5. 📚 Review Advanced ML prompts (Set B)

### If Test Fails:
1. 📋 Document specific errors
2. 🔍 Check browser console for details
3. 🐛 Review implementation files
4. 🔧 Fix issues
5. 🔄 Re-test

---

## 💡 Pro Tips

1. **Use Chrome DevTools** (F12) to monitor console
2. **Test with multiple datasets** to verify robustness
3. **Compare results** across multiple training runs
4. **Export results** to verify export functionality
5. **Test on mobile** to check responsiveness

---

## 📚 Full Documentation

For comprehensive testing:
- See `TESTING_QUICK_ML.md` for detailed test cases
- See `QUICK_ML_IMPLEMENTATION_SUMMARY.md` for technical details
- See main `README.md` for project overview

---

**Ready to test? Run `npm run dev` and follow the steps above!** 🚀
